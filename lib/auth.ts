import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { magicLink } from "better-auth/plugins"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { users } from "@/db/schema/users"
import { account as accountTable } from "@/db/schema/auth"
import { desc } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { render } from "@react-email/components"
import { MagicLinkEmail } from "../emails/magic-link"
import { VerificationEmail } from "../emails/verify-email"
import { ResetPasswordEmail } from "../emails/reset-password"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  baseURL: process.env.AUTH_BASE_URL || process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    "https://shoptimity.com",
    "http://localhost:3000",
    "https://mannish-avert-uncommon.ngrok-free.dev",
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",
    },
  },
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }: { user: any; url: string }) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[AUTH] Password Reset Link for ${user.email}: ${url}`)
      }
      const html = await render(
        ResetPasswordEmail({
          resetPasswordUrl: url,
          name: user.name || "there",
        })
      )
      await sendEmail({
        to: user.email,
        subject: "Reset your Shoptimity password",
        html,
      })
    },
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: any
      url: string
    }) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[AUTH] Verification Link for ${user.email}: ${url}`)
      }
      const html = await render(
        VerificationEmail({
          verificationUrl: url,
          name: user.name || "there",
        })
      )
      await sendEmail({
        to: user.email,
        subject: "Verify your Shoptimity account",
        html,
      })
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        if (process.env.NODE_ENV === "development") {
          console.log(`[AUTH] Magic Link for ${email}: ${url}`)
        }
        const ttlMinutes = parseInt(
          process.env.MAGIC_LINK_TTL_MINUTES || "15",
          10
        )
        const html = await render(
          MagicLinkEmail({ magicLinkUrl: url, expiresInMinutes: ttlMinutes })
        )
        await sendEmail({
          to: email,
          subject: "Sign in to Shoptimity",
          html,
        })
      },
    }),
  ],
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          // Find the most recently updated account for this user to determine login method
          const [lastAccount] = await db
            .select()
            .from(accountTable)
            .where(eq(accountTable.userId, session.userId))
            .orderBy(desc(accountTable.updatedAt))
            .limit(1)

          const mode = lastAccount?.providerId || "magic-link"

          await db
            .update(users)
            .set({ loginMode: mode })
            .where(eq(users.id, session.userId))
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: false,
      },
      loginMode: {
        type: "string",
        required: false,
      },
      firstName: {
        type: "string",
        required: false,
      },
      lastName: {
        type: "string",
        required: false,
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
export type UserWithRole = User & { role: string }
