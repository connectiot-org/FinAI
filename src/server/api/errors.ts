export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "MODEL_UNAVAILABLE"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_ERROR"
  | "INTERNAL";

export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  static validation(message: string, details?: unknown) {
    return new ApiError("VALIDATION_ERROR", message, 400, details);
  }

  static unauthorized(message = "Authentication required") {
    return new ApiError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message = "Access denied to requested resource") {
    return new ApiError("FORBIDDEN", message, 403);
  }

  static notFound(message = "Resource not found") {
    return new ApiError("NOT_FOUND", message, 404);
  }

  static rateLimited(message = "Rate limit exceeded. Please retry later.") {
    return new ApiError("RATE_LIMITED", message, 429);
  }

  static internal(message = "Internal server error") {
    return new ApiError("INTERNAL", message, 500);
  }
}
