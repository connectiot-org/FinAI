import { NextRequest } from "next/server";
import { apiSuccess } from "@/server/api/envelope";
import { createRequestContext } from "@/server/api/request-context";
import { prisma } from "@/server/db/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { requestId } = createRequestContext(req);
  let dbStatus: "ok" | "error" = "ok";

  try {
    // Ping DB
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  return apiSuccess(
    {
      status: "ok",
      db: dbStatus,
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    },
    requestId
  );
}
