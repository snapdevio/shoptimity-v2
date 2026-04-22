import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { magicLink } from "better-auth/plugins"
import { db } from "@/db"
import { sendEmail } from "@/lib/email"
import { render } from "@react-email/components"
import { MagicLinkEmail } from "@/emails/magic-link"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  baseURL: process.env.AUTH_BASE_URL || process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: ["https://shoptimity.com"],
  emailAndPassword: {
    enabled: false,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
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
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
export type UserWithRole = User & { role: string }
