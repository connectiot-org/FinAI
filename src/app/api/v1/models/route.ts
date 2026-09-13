import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/server/api/envelope";
import { createRequestContext } from "@/server/api/request-context";
import { modelRegistry } from "@/server/ai/registry/model-registry";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { requestId } = createRequestContext(req);
  try {
    const models = await modelRegistry.listModels();
    return apiSuccess({ models }, requestId);
  } catch (err) {
    return apiError(err, requestId);
  }
}
