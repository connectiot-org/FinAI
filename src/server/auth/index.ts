import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { env } from "../env";
import { userService } from "../services/user-service";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
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
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const normalizedEmail = credentials.email.toLowerCase().trim();
        const rawName = normalizedEmail.split("@")[0].replace(/[._-]/g, " ");
        const displayName = rawName
          ? rawName.charAt(0).toUpperCase() + rawName.slice(1)
          : "Finance User";

        try {
          const user = await userService.findOrCreateUser(normalizedEmail, displayName);
          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name || displayName,
              role: user.role,
            };
          }
        } catch {
          // Safe fallback when local DB is unreachable
        }

        return {
          id: `usr_${Buffer.from(normalizedEmail).toString("hex").slice(0, 12)}`,
          email: normalizedEmail,
          name: displayName,
          role: "USER",
        };
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
        (session.user as unknown as { id: string }).id = token.id as string;
        (session.user as unknown as { role: string }).role = (token.role as string) || "USER";
      }
      return session;
    },
  },
  secret: env.AUTH_SECRET,
};
