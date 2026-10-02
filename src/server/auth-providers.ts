import type { Provider } from "next-auth/providers";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import type { ServerEnv } from "@/env";

export function authProviderAvailability(env: ServerEnv) {
  return {
    email: Boolean(env.EMAIL_SERVER && env.EMAIL_FROM),
    google: Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
    apple: Boolean(env.AUTH_APPLE_ID && env.AUTH_APPLE_SECRET),
  };
}

/** Only providers whose credentials are configured are enabled. */
export function configuredProviders(env: ServerEnv): Provider[] {
  const available = authProviderAvailability(env);
  const providers: Provider[] = [];
  if (available.email) {
    providers.push(Nodemailer({ server: env.EMAIL_SERVER, from: env.EMAIL_FROM }));
  }
  if (available.google) {
    providers.push(Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET }));
  }
  if (available.apple) {
    providers.push(Apple({ clientId: env.AUTH_APPLE_ID, clientSecret: env.AUTH_APPLE_SECRET }));
  }
  return providers;
}
