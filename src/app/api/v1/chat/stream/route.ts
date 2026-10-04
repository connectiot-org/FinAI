import { NextRequest, NextResponse } from "next/server";
import { chatService } from "@/server/services/chat-service";
import { getCurrentUser } from "@/server/auth/session";
import { createRequestContext } from "@/server/api/request-context";
import { rateLimit, clientIpFrom } from "@/server/infra/rate-limiter";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Serverless streaming duration

const chatStreamSchema = z
  .object({
    modelId: z.string().max(120).default("auto"),
    answerMode: z.enum(["quick", "deep"]).default("deep"),
    conversationId: z.string().max(120).optional(),
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant", "system"]),
          content: z.string().max(200_000),
        })
      )
      .min(1)
      .max(200),
  })
  // Total payload cap: without it, 200 x 200k chars allows ~40MB of parsed
  // JSON per request — an allocation-churn DoS vector on a cost-bearing endpoint.
  .refine(
    (data) =>
      data.messages.reduce((acc, m) => acc + m.content.length, 0) <= 300_000,
    { message: "Total message content exceeds the 300,000 character limit" }
  );

export async function POST(req: NextRequest) {
  const { requestId } = createRequestContext(req);
  const user = await getCurrentUser();

  // Rate limit: authenticated users get a generous budget, guests a tighter one
  // (guest chat is intentionally available for demo purposes).
  const isGuest = user.isGuest;
  const limitKey = isGuest
    ? `chat:ip:${clientIpFrom(req.headers)}`
    : `chat:user:${user.id}`;
  const rl = rateLimit(limitKey, isGuest ? 10 : 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many chat requests. Please slow down and try again shortly.",
          retryable: true,
        },
        requestId,
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    );
  }

  try {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      // Malformed JSON body — this is a client error, not a server error.
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Request body must be valid JSON",
          },
          requestId,
        },
        { status: 400 }
      );
    }
    const parsed = chatStreamSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid chat stream payload",
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
      userIsGuest: user.isGuest,
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
        // When the client disconnects, enqueue() throws. We must NOT let that
        // exception break out of the for-await loop, because the generator's
        // finally/persistence logic (usage recording + assistant message save)
        // would be skipped via an implicit .return(). Instead we flag the
        // client as gone and keep draining the generator so the server-side
        // bookkeeping completes, then close silently.
        let clientGone = false;
        const safeEnqueue = (chunk: string) => {
          if (clientGone) return;
          try {
            controller.enqueue(encoder.encode(chunk));
          } catch {
            clientGone = true;
          }
        };

        try {
          for await (const event of stream) {
            if (req.signal.aborted) {
              clientGone = true;
            }
            safeEnqueue(
              `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`
            );
          }
        } catch (err) {
          const errMsg =
            err instanceof Error ? err.message : "Stream processing failure";
          safeEnqueue(
            `event: error\ndata: ${JSON.stringify({
              code: "STREAM_ERROR",
              message: errMsg,
              retryable: true,
            })}\n\n`
          );
        } finally {
          try {
            controller.close();
          } catch {
            // Client already gone — nothing to close.
          }
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
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
