import { NextRequest, NextResponse } from "next/server";
import { createRequestContext } from "@/server/api/request-context";
import { prisma } from "@/server/db/client";
import { env } from "@/server/env";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { requestId } = createRequestContext(req);
  let dbStatus: "ok" | "error" | "unconfigured" = "unconfigured";

  if (env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "ok";
    } catch {
      dbStatus = "error";
    }
  }

  const healthy = dbStatus !== "error";

  return NextResponse.json(
    {
      data: {
        status: healthy ? "ok" : "degraded",
        db: dbStatus,
        ai: env.OPENROUTER_API_KEY ? "configured" : "unconfigured",
        version: "0.2.1",
        timestamp: new Date().toISOString(),
      },
      requestId,
    },
    // A hard DB failure must fail the probe so load balancers can react.
    { status: healthy ? 200 : 503 }
  );
}
