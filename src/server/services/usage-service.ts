import { prisma } from "../db/client";
import { Prisma } from "@prisma/client";

export interface RecordAIRequestInput {
  userId: string;
  conversationId?: string;
  modelId: string;
  provider: string;
  status: "PENDING" | "STREAMING" | "SUCCEEDED" | "FAILED" | "ABORTED";
  latencyMs?: number;
  firstTokenMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
  estimated?: boolean;
  fallbackFrom?: string;
  fallbackReason?: string;
  promptVersion?: string;
  answerMode?: "QUICK_ANSWER" | "DEEP_ANALYSIS";
  requestId: string;
  errorCode?: string;
}

export class UsageService {
  async recordAIRequest(input: RecordAIRequestInput): Promise<Prisma.AIRequestGetPayload<object> | null> {
    const costDecimal = input.costUsd !== undefined ? new Prisma.Decimal(input.costUsd) : null;

    try {
      const request = await prisma.aIRequest.create({
        data: {
          userId: input.userId,
          conversationId: input.conversationId,
          modelId: input.modelId,
          provider: input.provider,
          status: input.status,
          latencyMs: input.latencyMs,
          firstTokenMs: input.firstTokenMs,
          promptTokens: input.promptTokens,
          completionTokens: input.completionTokens,
          costUsd: costDecimal,
          estimated: input.estimated || false,
          fallbackFrom: input.fallbackFrom,
          fallbackReason: input.fallbackReason,
          promptVersion: input.promptVersion,
          answerMode: input.answerMode,
          requestId: input.requestId,
          errorCode: input.errorCode,
        },
      });

      // Increment daily usage record if completed successfully
      if (input.status === "SUCCEEDED" || input.status === "ABORTED") {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const promptTokens = input.promptTokens || 0;
        const completionTokens = input.completionTokens || 0;
        const costIncrement = costDecimal || new Prisma.Decimal(0);

        await prisma.usageRecord.upsert({
          where: {
            userId_day: {
              userId: input.userId,
              day: today,
            },
          },
          update: {
            requests: { increment: 1 },
            promptTokens: { increment: promptTokens },
            completionTokens: { increment: completionTokens },
            costUsd: { increment: costIncrement },
          },
          create: {
            userId: input.userId,
            day: today,
            requests: 1,
            promptTokens,
            completionTokens,
            costUsd: costIncrement,
          },
        });
      }

      return request;
    } catch (err) {
      console.warn("Usage tracking DB write skipped (database offline or unconfigured):", err instanceof Error ? err.message : err);
      // Return null instead of a fabricated record: a fake id would violate
      // the Message.aiRequestId FK and silently drop the assistant message.
      return null;
    }
  }
}

export const usageService = new UsageService();
