import "server-only";
import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import { cookies } from "next/headers";
import { TERMS_COOKIE } from "@/lib/terms";
import { acceptTerms, validConsentIntent } from "./services/terms-consent";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { serverEnv } from "@/env";
import { configuredProviders } from "./auth-providers";
import { getDb } from "./db";
import { accounts, sessions, users, verificationTokens } from "./db/schema";

type UserRole = (typeof users.$inferSelect)["role"];

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      termsVersion: string | null;
      termsAcceptedAt: string | null;
    } & DefaultSession["user"];
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
    pages: {
      signIn: "/signin",
      verifyRequest: "/verify-request",
      error: "/auth-error",
    },
    providers: configuredProviders(env),
    events: {
      async signIn({ user, account }) {
        const provider = account?.provider;
        if (!user.id || !provider) return;
        const jar = await cookies();
        const token = jar.get(TERMS_COOKIE)?.value;
        jar.delete(TERMS_COOKIE);
        const email = provider === "nodemailer" ? (user.email ?? null) : null;
        if (validConsentIntent(token, provider, email, env.AUTH_SECRET, new Date()))
          await acceptTerms(getDb(), user.id, new Date());
      },
    },
    callbacks: {
      session({ session, user }) {
        session.user.id = user.id;
        session.user.role = (user as { role?: UserRole }).role ?? "reader";
        const consent = user as { termsVersion?: string | null; termsAcceptedAt?: Date | null };
        session.user.termsVersion = consent.termsVersion ?? null;
        session.user.termsAcceptedAt = consent.termsAcceptedAt?.toISOString() ?? null;
        return session;
      },
    },
  };
});
