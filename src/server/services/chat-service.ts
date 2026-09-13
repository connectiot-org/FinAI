import { conversationService } from "./conversation-service";
import { aiGatewayService } from "./ai-gateway-service";
import { usageService } from "./usage-service";
import { assembleContextWindow } from "../ai/gateway/context-window";
import { promptAssembler } from "../ai/prompts/prompt-assembler";
import { SseEvent, SseUsagePayload } from "../../lib/sse-types";
import { MessagePart } from "../domain/conversation";
import { checkInterpretationLabeling } from "../ai/guardrails/label-check";
import { checkDisclaimerPresence } from "../ai/guardrails/disclaimer-check";
import { prisma } from "../db/client";

export interface RunChatTurnOptions {
  conversationId?: string;
  userId: string;
  modelId: string;
  answerMode?: "quick" | "deep";
  userMessageContent: string;
  requestId: string;
  signal?: AbortSignal;
}

export class ChatService {
  async *runChatTurn(options: RunChatTurnOptions): AsyncIterable<SseEvent> {
    const {
      conversationId,
      userId,
      modelId,
      answerMode = "deep",
      userMessageContent,
      requestId,
      signal,
    } = options;

    let targetConvId = conversationId;

    // 1. If conversation exists, persist user message
    if (targetConvId) {
      try {
        await conversationService.appendMessage({
          conversationId: targetConvId,
          userId,
          role: "USER",
          parts: [{ type: "text", content: userMessageContent }],
        });
      } catch (err) {
        console.warn("Could not persist user message:", err instanceof Error ? err.message : err);
      }
    }

    // 2. Assemble system prompt from Prompt Assembler
    const systemPrompt = promptAssembler.assemble({
      mode: answerMode,
      modelTier: "Balanced",
    });

    // 3. Assemble Windowed Context
    const messagesHistory = targetConvId
      ? (await conversationService.getConversation(targetConvId, userId)).messages.map((m) => ({
          role: (m.role.toLowerCase() === "user" ? "user" : "assistant") as "user" | "assistant",
          content: (m.parts as unknown as MessagePart[])
            .filter((p) => p.type === "text")
            .map((p) => (p as { content: string }).content)
            .join("\n"),
        }))
      : [{ role: "user" as const, content: userMessageContent }];

    const windowedMessages = assembleContextWindow(systemPrompt, messagesHistory, {
      maxContextTokens: 12000,
    });

    let accumulatedText = "";
    let usagePayload: SseUsagePayload | null = null;
    let completionStatus: "SUCCEEDED" | "STOPPED" | "FAILED" = "SUCCEEDED";

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
      } else if (event.event === "done" && event.data.status === "STOPPED") {
        completionStatus = "STOPPED";
      }

      yield event;
    }

    // 5. Post-process guardrails & construct assistant parts
    const assistantParts: MessagePart[] = [
      { type: "text", content: accumulatedText },
    ];

    if (completionStatus === "STOPPED") {
      assistantParts.push({ type: "stopped", reason: "Generation aborted by user" });
    }

    // Guardrail warnings if any
    const labelCheck = checkInterpretationLabeling(accumulatedText);
    const disclaimerCheck = checkDisclaimerPresence(accumulatedText);

    // 6. Record AIRequest in DB
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
      requestId,
      answerMode: answerMode === "deep" ? "DEEP_ANALYSIS" : "QUICK_ANSWER",
    });

    // 7. Persist assistant message in thread if active
    if (targetConvId) {
      try {
        await conversationService.appendMessage({
          conversationId: targetConvId,
          userId,
          role: "ASSISTANT",
          parts: assistantParts,
          aiRequestId: aiReq.id,
        });

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
            data: { title: cleanTitle },
          });
        }
      } catch (dbErr) {
        console.warn("Could not persist assistant message to DB:", dbErr instanceof Error ? dbErr.message : dbErr);
      }
    }
  }
}

export const chatService = new ChatService();
