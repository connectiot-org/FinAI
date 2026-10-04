import { getCurrentUser, SessionUser } from "../auth/session";
import { createRequestContext } from "./request-context";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export interface AuthResult {
  user: SessionUser;
  /** Prefabricated 401 response when the caller is not authenticated. */
  response?: NextResponse;
}

/**
 * Guard for endpoints that require a real, authenticated user.
 * Returns a 401 envelope (with requestId, matching the API error contract)
 * when the request is anonymous.
 */
export async function requireUser(req?: NextRequest): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (user.isGuest) {
    const { requestId } = createRequestContext(req);
    return {
      user,
      response: NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required for this endpoint",
          },
          requestId,
        },
        { status: 401 }
      ),
    };
  }
  return { user };
}
