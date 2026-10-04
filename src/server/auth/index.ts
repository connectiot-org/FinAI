import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { env, getAuthSecret } from "../env";
import { userService } from "../services/user-service";
import { hashPassword, verifyPassword } from "./password";

/**
 * Credentials flow: email + password.
 * - First sign-in for an unknown email creates the account (sign-up) with the
 *   chosen password. This preserves the single-page "sign in / sign up" UX the
 *   product already ships.
 * - Subsequent sign-ins verify the stored scrypt hash. Wrong passwords are
 *   rejected (previously ANY password was accepted).
 * - Accounts created via OAuth (no stored password) cannot be accessed through
 *   the credentials flow — they must sign in with their provider.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  providers: [
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;
        if (
          !email ||
          !email.includes("@") ||
          typeof password !== "string" ||
          password.length < 8
        ) {
          return null;
        }

        const displayName =
          typeof credentials?.name === "string" && credentials.name.trim()
            ? credentials.name.trim()
            : email
                .split("@")[0]
                .replace(/[._-]+/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());

        try {
          const existing = await userService.getByEmail(email);

          if (existing) {
            if (!existing.passwordHash) {
              // OAuth-only account — credentials login is not permitted.
              return null;
            }
            if (!(await verifyPassword(password, existing.passwordHash))) {
              return null;
            }
            return {
              id: existing.id,
              email: existing.email,
              name: existing.name || displayName,
              role: existing.role,
            };
          }

          // New account: create with hashed password.
          const passwordHash = await hashPassword(password);
          const created = await userService.createUser(
            email,
            displayName,
            passwordHash
          );
          return {
            id: created.id,
            email: created.email,
            name: created.name || displayName,
            role: created.role,
          };
        } catch (err) {
          console.error("[auth] credentials authorize failed:", err);
          // Fail closed on infrastructure errors — never fabricate a user.
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role?: string }).role || "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as { id?: string }).id =
          token.id as string | undefined;
        (session.user as unknown as { role?: string }).role =
          (token.role as string) || "USER";
      }
      return session;
    },
  },
  secret: getAuthSecret(),
};
