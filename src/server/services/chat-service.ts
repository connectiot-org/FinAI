import { conversationService } from "./conversation-service";
import { aiGatewayService } from "./ai-gateway-service";
import { usageService } from "./usage-service";
import { assembleContextWindow } from "../ai/gateway/context-window";
import { promptAssembler } from "../ai/prompts/prompt-assembler";
import { SseEvent, SseUsagePayload } from "../../lib/sse-types";
import { MessagePart } from "../domain/conversation";
import { checkInterpretationLabeling } from "../ai/guardrails/label-check";
import { checkDisclaimerPresence } from "../ai/guardrails/disclaimer-check";
import { fenceUntrustedFinancialData } from "../ai/guardrails/injection-fencing";
import { prisma } from "../db/client";

export interface RunChatTurnOptions {
  conversationId?: string;
  userId: string;
  /** True when the caller is anonymous — DB persistence is skipped. */
  userIsGuest?: boolean;
  modelId: string;
  answerMode?: "quick" | "deep";
  userMessageContent: string;
  messages?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  requestId: string;
  signal?: AbortSignal;
}

export class ChatService {
  async *runChatTurn(options: RunChatTurnOptions): AsyncIterable<SseEvent> {
    const {
      conversationId,
      userId,
      userIsGuest = false,
      modelId,
      answerMode = "deep",
      userMessageContent,
      messages: clientMessages,
      requestId,
      signal,
    } = options;

    let targetConvId = conversationId;

    // 1. If conversation exists, persist user message (authenticated users only).
    if (targetConvId && !userIsGuest) {
      try {
        await conversationService.appendMessage({
          conversationId: targetConvId,
          userId,
          role: "USER",
          parts: [{ type: "text", content: userMessageContent }],
        });
      } catch (err) {
        console.warn(
          "Could not persist user message:",
          err instanceof Error ? err.message : err
        );
        // A missing/inaccessible conversation must not kill the stream —
        // continue as an ephemeral turn.
        if (err instanceof Error && err.message.includes("not found")) {
          targetConvId = undefined;
        }
      }
    } else if (targetConvId && userIsGuest) {
      // Guests have no server-side identity; run the turn without persistence.
      targetConvId = undefined;
    }

    // 2. Assemble system prompt from Prompt Assembler
    const { content: systemPrompt, version: promptVersion } =
      promptAssembler.assemble(
        {
          mode: answerMode,
          modelTier: "Balanced",
        },
        true
      );

    // 3. Assemble Windowed Context: prefer client messages history if provided
    // (preserves multi-turn state), else fall back to persisted history.
    // The latest user message is fenced when it embeds untrusted file/dataset
    // content, so embedded directives cannot override the system prompt.
    const UNTRUSTED_DATA_MARKERS = [
      "[DATASET PROFILE:",
      "FULL-DATASET NUMERICAL STATISTICS",
      "[Attached File:",
    ];
    const looksLikeDataPayload = (content: string) =>
      UNTRUSTED_DATA_MARKERS.some((m) => content.includes(m));

    let messagesHistory: Array<{ role: "user" | "assistant"; content: string }>;
    if (clientMessages && clientMessages.length > 0) {
      messagesHistory = clientMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m, idx, arr) => {
          const isLast = idx === arr.length - 1;
          if (isLast && m.role === "user" && looksLikeDataPayload(m.content)) {
            return {
              role: "user" as const,
              content: fenceUntrustedFinancialData(m.content, "CLIENT_DATASET"),
            };
          }
          return { role: m.role as "user" | "assistant", content: m.content };
        });
    } else if (targetConvId) {
      try {
        const conv = await conversationService.getConversation(targetConvId, userId);
        messagesHistory = conv.messages.map((m) => ({
          role: (m.role.toLowerCase() === "user" ? "user" : "assistant") as
            | "user"
            | "assistant",
          content: (m.parts as unknown as MessagePart[])
            .filter((p) => p.type === "text")
            .map((p) => (p as { content: string }).content)
            .join("\n"),
        }));
      } catch {
        // History unavailable — degrade to the current message only.
        messagesHistory = [{ role: "user" as const, content: userMessageContent }];
      }
    } else {
      messagesHistory = [{ role: "user" as const, content: userMessageContent }];
    }

    const windowedMessages = assembleContextWindow(systemPrompt, messagesHistory, {
      maxContextTokens: 24000,
    });

    let accumulatedText = "";
    let usagePayload: SseUsagePayload | null = null;
    let completionStatus: "SUCCEEDED" | "STOPPED" | "FAILED" = "SUCCEEDED";
    let failoverOccurred = false;
    let lastErrorCode: string | undefined;

    // 4. Stream from AI Gateway
    const gatewayStream = aiGatewayService.streamTurn({
      modelId,
      messages: windowedMessages,
      answerMode,
      requestId,
      signal,
    });

    for await (const event of gatewayStream) {
      if (event.event === "text-delta") {
        accumulatedText += event.data.text;
      } else if (event.event === "usage") {
        usagePayload = event.data;
      } else if (event.event === "error") {
        completionStatus = "FAILED";
        lastErrorCode = event.data.code;
      } else if (event.event === "step" && event.data.id.startsWith("step-failover")) {
        failoverOccurred = true;
      } else if (event.event === "done" && event.data.status === "STOPPED") {
        completionStatus = "STOPPED";
      }

      // Echo the server conversation id back to the client on completion so
      // it can continue the same server-side thread on subsequent messages
      // (persistence, auto-title, usage + audit trail stay reachable).
      if (event.event === "done" && targetConvId) {
        yield {
          event: "done",
          data: { ...event.data, conversationId: targetConvId },
        };
        continue;
      }

      yield event;
    }

    // If the client aborted mid-stream, the gateway loop above exits; record
    // the turn as ABORTED with whatever partial content was produced.
    if (signal?.aborted && completionStatus === "SUCCEEDED") {
      completionStatus = "STOPPED";
    }

    // 5. Post-process guardrails & construct assistant parts
    const assistantParts: MessagePart[] = [
      { type: "text", content: accumulatedText },
    ];

    if (completionStatus === "STOPPED") {
      assistantParts.push({
        type: "stopped",
        reason: "Generation aborted by user",
      });
    }

    // Guardrail notices: results are surfaced to the client and persisted
    // (previously they were computed and silently discarded).
    const labelCheck = checkInterpretationLabeling(accumulatedText);
    const disclaimerCheck = checkDisclaimerPresence(accumulatedText);
    const guardrailNotices: string[] = [];
    if (!labelCheck.passed && labelCheck.warning) {
      guardrailNotices.push(labelCheck.warning);
    }
    if (!disclaimerCheck.passed && disclaimerCheck.warning) {
      guardrailNotices.push(disclaimerCheck.warning);
    }
    if (guardrailNotices.length > 0) {
      assistantParts.push({
        type: "guardrail",
        notices: guardrailNotices,
      } as unknown as MessagePart);
      yield {
        event: "notice",
        data: {
          kind: "guardrail",
          notices: guardrailNotices,
        },
      };
    }

    // 6. Record AIRequest in DB (authenticated users only — guests have no
    // DB identity and fabricating one would violate FK constraints).
    let aiReqId: string | undefined;
    if (!userIsGuest) {
      const aiReq = await usageService.recordAIRequest({
        userId,
        conversationId: targetConvId,
        modelId,
        provider: "openrouter",
        status: completionStatus === "STOPPED" ? "ABORTED" : completionStatus,
        latencyMs: usagePayload?.durationMs,
        promptTokens: usagePayload?.promptTokens,
        completionTokens: usagePayload?.completionTokens,
        costUsd: usagePayload?.costUsd,
        // Honesty flags: mark estimated token counts as estimated, and record
        // whether the gateway had to fail over or errored (previously these
        // fields were accepted but never populated).
        estimated: usagePayload?.estimated ?? false,
        fallbackFrom: failoverOccurred ? modelId : undefined,
        fallbackReason: failoverOccurred ? "gateway-automatic-failover" : undefined,
        errorCode: lastErrorCode,
        requestId,
        promptVersion,
        answerMode: answerMode === "deep" ? "DEEP_ANALYSIS" : "QUICK_ANSWER",
      });
      aiReqId = aiReq?.id;
    }

    // 7. Persist assistant message in thread if active
    if (targetConvId && !userIsGuest) {
      try {
        if (accumulatedText.trim() || completionStatus !== "SUCCEEDED") {
          await conversationService.appendMessage({
            conversationId: targetConvId,
            userId,
            role: "ASSISTANT",
            parts: assistantParts,
            aiRequestId: aiReqId,
          });
        }

        // 8. Auto-Title Heuristic on First Turn
        const conv = await prisma.conversation.findUnique({
          where: { id: targetConvId },
          include: { _count: { select: { messages: true } } },
        });

        if (conv && conv.title === "New Financial Thread" && conv._count.messages <= 2) {
          const words = userMessageContent.trim().split(/\s+/).slice(0, 6).join(" ");
          const cleanTitle = words.charAt(0).toUpperCase() + words.slice(1);
          await prisma.conversation.update({
            where: { id: targetConvId },
            data: { title: cleanTitle.slice(0, 200) },
          });
        }
      } catch (dbErr) {
        console.warn(
          "Could not persist assistant message to DB:",
          dbErr instanceof Error ? dbErr.message : dbErr
        );
      }
    }
  }
}

export const chatService = new ChatService();
