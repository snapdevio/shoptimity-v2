import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export interface AppSession {
  userId: string
  role: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
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

  const user = session.user as any
  return {
    userId: user.id,
    role: user.role || "user",
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
  }
}
