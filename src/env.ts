import { z } from "zod";

// Empty values in .env files ("KEY=") mean "not set".
const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, error: "必須是 postgres:// 連線字串" }),
    AUTH_SECRET: z.string().min(32, "至少 32 字元；可用 `pnpm dlx auth secret` 產生"),
    AUTH_URL: z.preprocess((v) => (v === "" ? undefined : v), z.url().optional()),
    AUTH_GOOGLE_ID: optionalString,
    AUTH_GOOGLE_SECRET: optionalString,
    AUTH_APPLE_ID: optionalString,
    AUTH_APPLE_SECRET: optionalString,
    // SMTP connection string for magic-link email, e.g. smtp://user:pass@host:587
    EMAIL_SERVER: optionalString,
    EMAIL_FROM: optionalString,
  })
  .superRefine((env, ctx) => {
    const pairs = [
      ["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"],
      ["AUTH_APPLE_ID", "AUTH_APPLE_SECRET"],
      ["EMAIL_SERVER", "EMAIL_FROM"],
    ] as const;
    for (const [a, b] of pairs) {
      if (Boolean(env[a]) !== Boolean(env[b])) {
        ctx.addIssue({
          code: "custom",
          path: [env[a] ? b : a],
          message: `${a} 與 ${b} 必須同時設定或同時留空`,
        });
      }
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`環境變數設定錯誤：\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

let cached: ServerEnv | undefined;

/** Parsed lazily so `next build` does not require runtime secrets. */
export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
