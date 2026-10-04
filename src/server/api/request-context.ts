import { NextRequest } from "next/server";

export interface RequestContext {
  requestId: string;
  timestamp: number;
}

/**
 * Builds a per-request context id. A client-supplied `x-request-id` is only
 * trusted when it is short, alphanumeric and dashed (otherwise it could be
 * used for log forging or header reflection abuse) — unknown values are
 * replaced with a server-generated id.
 */
export function createRequestContext(req?: NextRequest): RequestContext {
  const incomingId = req?.headers.get("x-request-id");
  const isSafe =
    !!incomingId &&
    incomingId.length <= 64 &&
    /^[A-Za-z0-9_.-]+$/.test(incomingId);
  const requestId =
    isSafe && incomingId
      ? incomingId
      : `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  return {
    requestId,
    timestamp: Date.now(),
  };
}
