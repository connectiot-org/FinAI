import { NextResponse } from "next/server";
import { ApiError } from "./errors";

export interface ApiSuccessResponse<T> {
  data: T;
  requestId: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

export function apiSuccess<T>(data: T, requestId: string, status = 200) {
  return NextResponse.json<ApiSuccessResponse<T>>({ data, requestId }, { status });
}

export function apiError(err: unknown, requestId: string) {
  if (err instanceof ApiError) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
        requestId,
      },
      { status: err.statusCode }
    );
  }

  const message = err instanceof Error ? err.message : "Internal Server Error";
  return NextResponse.json<ApiErrorResponse>(
    {
      error: {
        code: "INTERNAL",
        message,
      },
      requestId,
    },
    { status: 500 }
  );
}
