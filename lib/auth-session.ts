import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export interface AppSession {
  userId: string
  role: string
  email: string
}

/**
 * Gets the current session from Better Auth.
 * Use this in server components and server actions.
 */
export async function getAppSession(): Promise<AppSession | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) return null

  return {
    userId: session.user.id,
    role: ((session.user as Record<string, unknown>).role as string) || "user",
    email: session.user.email,
  }
}
