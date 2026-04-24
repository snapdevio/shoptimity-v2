import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth, UserWithRole } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (process.env.NODE_ENV !== "development" && !session) {
    redirect("/login")
  }

  // Provide mock user if no session in dev mode
  const user = session
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as UserWithRole).role || "user",
      }
    : {
        id: "dev-user-id",
        name: "Dev User",
        email: "dev@localhost",
        role: "admin",
      }

  return <DashboardShell user={user}>{children}</DashboardShell>
}
