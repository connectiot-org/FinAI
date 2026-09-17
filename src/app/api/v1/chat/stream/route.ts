import { NextRequest, NextResponse } from "next/server";
import { chatService } from "@/server/services/chat-service";
import { getCurrentUser } from "@/server/auth/session";
import { createRequestContext } from "@/server/api/request-context";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Serverless streaming duration

const chatStreamSchema = z.object({
  modelId: z.string().default("auto"),
  answerMode: z.enum(["quick", "deep"]).default("deep"),
  conversationId: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  const { requestId } = createRequestContext(req);
  const user = await getCurrentUser();

  try {
    const json = await req.json();
    const parsed = chatStreamSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid chat stream payload",
            details: parsed.error.format(),
          },
          requestId,
        },
        { status: 400 }
      );
    }

    const { modelId, answerMode, conversationId, messages } = parsed.data;
    const latestUserMessage = messages[messages.length - 1].content;

    const stream = chatService.runChatTurn({
      conversationId,
      userId: user.id,
      modelId,
      answerMode,
      userMessageContent: latestUserMessage,
      messages,
      requestId,
      signal: req.signal,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            const chunk = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "Stream processing failure";
          const errChunk = `event: error\ndata: ${JSON.stringify({
            code: "STREAM_ERROR",
            message: errMsg,
            retryable: true,
          })}\n\n`;
          controller.enqueue(encoder.encode(errChunk));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Request-Id": requestId,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: msg,
        },
        requestId,
      },
      { status: 500 }
    );
  }
}
