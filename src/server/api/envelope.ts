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

  // Unexpected errors: log the details server-side, return a generic message.
  // Raw Prisma/driver messages can leak schema, table and connection details.
  console.error(`[api] Unhandled error (requestId=${requestId}):`, err);
  return NextResponse.json<ApiErrorResponse>(
    {
      error: {
        code: "INTERNAL",
        message: "An internal error occurred. Please try again later.",
      },
      requestId,
    },
    { status: 500 }
  );
}
