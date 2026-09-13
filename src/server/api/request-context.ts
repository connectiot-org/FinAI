import { NextRequest } from "next/server";

export interface RequestContext {
  requestId: string;
  timestamp: number;
}

export function createRequestContext(req?: NextRequest): RequestContext {
  const incomingId = req?.headers.get("x-request-id");
  const requestId = incomingId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  return {
    requestId,
    timestamp: Date.now(),
  };
}
