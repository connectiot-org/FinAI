import { prisma } from "../db/client";
import { Role } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}

export async function getCurrentUser(): Promise<SessionUser> {
  // In development and testing without NextAuth session cookies, resolve or create default dev admin user
  try {
    let user = await prisma.user.findFirst({
      where: { email: "admin@fintra.ai" },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "admin@fintra.ai",
          name: "Fintra Controller Admin",
          role: "ADMIN",
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch {
    // If DB is offline, provide memory fallback
    return {
      id: "usr_dev_admin",
      email: "admin@fintra.ai",
      name: "Fintra Controller Admin",
      role: "ADMIN",
    };
  }
}
