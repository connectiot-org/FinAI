import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY ||
  "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";

// Fallback chain for free tier / rate limits
const FALLBACK_MODELS = [
  "openrouter/free",
  "nvidia/nemotron-3.5-lightning:free",
  "dots-studio/dots-3-note-preview:free",
  "google/gemma-4-26b-a4b-it:free",
  "liquid/lfm-2.5-2.6b:free",
  "poolside/laguna-s-2.1:free",
];

const SYSTEM_FINANCIAL_PROMPT = `You are FInAI, a senior financial intelligence analyst and controller assistant. 
Your tone is professional, rigorous, and grounded in corporate finance standards (FP&A, accounting, auditing, variance analysis).
Always format financial analysis cleanly with markdown tables, precise figures, clear assumptions, and variance percentages (+/-).
When asked to compare budgets or actuals, highlight key variances and suggest concrete operational action items.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, modelId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    // Determine candidate model
    let targetModel = modelId || "auto";
    if (targetModel === "auto") {
      targetModel = "openrouter/free";
    }

    const payload = {
      model: targetModel,
      messages: [{ role: "system", content: SYSTEM_FINANCIAL_PROMPT }, ...messages],
      temperature: 0.2,
      max_tokens: 1200,
    };

    let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://finai.ai",
        "X-Title": "FInAI Financial Workspace",
      },
      body: JSON.stringify(payload),
    });

    let data = await response.json();
    let rerouted = false;
    let effectiveModel = targetModel;

    // If target model failed (e.g. requires paid credits or endpoint not found on free key), failover to available model
    if (!response.ok || data.error) {
      console.warn(`Model ${targetModel} error:`, data.error?.message, "Attempting failover...");
      for (const fallback of FALLBACK_MODELS) {
        if (fallback === targetModel) continue;
        try {
          const fallbackRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://finai.ai",
              "X-Title": "FInAI Financial Workspace",
            },
            body: JSON.stringify({
              ...payload,
              model: fallback,
            }),
          });
          const fallbackData = await fallbackRes.json();
          if (fallbackRes.ok && fallbackData.choices?.[0]?.message) {
            response = fallbackRes;
            data = fallbackData;
            rerouted = true;
            effectiveModel = fallback;
            break;
          }
        } catch (e) {
          console.error("Fallback error:", e);
        }
      }
    }

    if (!response.ok || !data.choices?.[0]?.message) {
      return NextResponse.json(
        {
          error: data.error?.message || "Failed to generate completion from AI engine",
        },
        { status: 500 }
      );
    }

    const replyContent = data.choices[0].message.content;

    return NextResponse.json({
      content: replyContent,
      modelUsed: effectiveModel,
      rerouted,
      usage: data.usage || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Chat API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
