import { prisma } from "../db/client";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "./index";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  /** True when the request is anonymous and a synthetic guest identity is used. */
  isGuest: boolean;
}

function guestIdentity(): SessionUser {
  return {
    id: "guest",
    email: "guest@anonymous.local",
    name: "Guest",
    role: Role.USER,
    isGuest: true,
  };
}

/**
 * Resolves the identity of an authenticated request from the NextAuth session.
 * Never elevates anonymous callers to ADMIN (the previous implementation
 * auto-created and returned an admin user for every request).
 *
 * Authenticated  -> the real user row from the DB (session token id).
 * Unauthenticated -> a non-privileged guest identity (role USER, no DB row),
 *   used by endpoints that intentionally allow anonymous/demo access (chat
 *   streaming). Ownership-scoped endpoints must call requireUser() instead.
 *
 * DB outage with a valid session -> identity falls back to the signed JWT
 *   claims (id/email/name/role are embedded at sign-in). Silently downgrading
 *   a signed-in user to a guest would produce wrong 401s on protected
 *   endpoints and quietly drop persistence + usage recording; DB-backed
 *   routes still fail with 503 on their own queries, which is the correct
 *   degradation signal.
 */
export async function getCurrentUser(): Promise<SessionUser> {
  let sessionUserId: string | undefined;
  let sessionEmail: string | undefined;
  let sessionName: string | null | null = null;
  let sessionRole: string | undefined;

  try {
    const session = await getServerSession(authOptions);
    const su = session?.user as
      | { id?: string; email?: string; name?: string | null; role?: string }
      | undefined;
    sessionUserId = su?.id;
    sessionEmail = su?.email;
    sessionName = su?.name ?? null;
    sessionRole = su?.role;
  } catch {
    // Session resolution failure — treat as anonymous (fail safe, not open).
    return guestIdentity();
  }

  if (!sessionUserId) {
    return guestIdentity();
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isGuest: false,
      };
    }
    // Valid token but the user row no longer exists — treat as anonymous.
    return guestIdentity();
  } catch {
    // DB unreachable: trust the signed JWT claims (see doc comment above).
    return {
      id: sessionUserId,
      email: sessionEmail ?? "unknown@finai.local",
      name: sessionName,
      role: (sessionRole as Role) || Role.USER,
      isGuest: false,
    };
  }
}
