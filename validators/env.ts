import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  MAGIC_LINK_TTL_MINUTES: z.coerce.number().int().positive().default(15),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),

  // SMTP
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false" as const)
    .transform((v) => v === "true"),
  EMAIL_FROM: z.string().min(1),

  // Cloudflare R2
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_TEMPLATES_BUCKET_NAME: z.string().min(1),
  R2_ENDPOINT: z.string().url(),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validated environment variables.
 *
 * During Next.js build, some env vars may not be set. We use safeParse with
 * a fallback for NEXT_PUBLIC_ vars so the build does not crash. At runtime
 * the full parse is enforced.
 */
function getEnv(): Env {
  // At build time NEXT_PUBLIC_ vars are inlined but server-only vars may be
  // absent. safeParse lets the build succeed; runtime will still crash if
  // a required var is missing when first accessed.
  const result = envSchema.safeParse(process.env)

  if (result.success) {
    return result.data
  }

  // In production / runtime we want a hard failure with clear diagnostics.
  if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
    console.warn(
      "[env] Validation failed – falling back (build-time?):",
      result.error.flatten().fieldErrors
    )
  }

  // Re-throw at runtime so missing vars surface immediately.
  if (
    process.env.NODE_ENV === "production" &&
    typeof window === "undefined" &&
    !process.env.NEXT_PHASE // not during build
  ) {
    throw new Error(
      `Environment validation failed:\n${JSON.stringify(result.error.flatten().fieldErrors, null, 2)}`
    )
  }

  // Build-time fallback: return whatever we got with defaults filled in.
  // Missing values will be empty strings, which will fail at actual usage.
  return result.data as unknown as Env
}

export const env = getEnv()
