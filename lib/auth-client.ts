import { createAuthClient } from "better-auth/react"
import {
  magicLinkClient,
  inferAdditionalFields,
} from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  emailPassword: {
    enabled: true,
  },
  plugins: [
    magicLinkClient(),
    inferAdditionalFields({
      user: {
        firstName: { type: "string" },
        lastName: { type: "string" },
      },
    }),
  ],
})

export const { signIn, signOut, useSession } = authClient
