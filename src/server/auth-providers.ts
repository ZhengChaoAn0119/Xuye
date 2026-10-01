import type { Provider } from "next-auth/providers";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import type { ServerEnv } from "@/env";

/** Only providers whose credentials are configured are enabled. */
export function configuredProviders(env: ServerEnv): Provider[] {
  const providers: Provider[] = [];
  if (env.EMAIL_SERVER && env.EMAIL_FROM) {
    providers.push(Nodemailer({ server: env.EMAIL_SERVER, from: env.EMAIL_FROM }));
  }
  if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
    providers.push(Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET }));
  }
  if (env.AUTH_APPLE_ID && env.AUTH_APPLE_SECRET) {
    providers.push(Apple({ clientId: env.AUTH_APPLE_ID, clientSecret: env.AUTH_APPLE_SECRET }));
  }
  return providers;
}
