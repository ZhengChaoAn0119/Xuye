import "server-only";
import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { serverEnv } from "@/env";
import { configuredProviders } from "./auth-providers";
import { getDb } from "./db";
import { accounts, sessions, users, verificationTokens } from "./db/schema";

type UserRole = (typeof users.$inferSelect)["role"];

declare module "next-auth" {
  interface Session {
    user: { id: string; role: UserRole } & DefaultSession["user"];
  }
}

// Lazy config: env and the database are only touched when a request needs auth,
// never during `next build`.
export const { handlers, auth, signIn, signOut } = NextAuth((): NextAuthConfig => {
  const env = serverEnv();
  return {
    secret: env.AUTH_SECRET,
    // Self-hosted behind a reverse proxy; the host header is trusted.
    trustHost: true,
    adapter: DrizzleAdapter(getDb(), {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    session: { strategy: "database" },
    providers: configuredProviders(env),
    callbacks: {
      session({ session, user }) {
        session.user.id = user.id;
        session.user.role = (user as { role?: UserRole }).role ?? "reader";
        return session;
      },
    },
  };
});
