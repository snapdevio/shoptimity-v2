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

  if (!session) {
    redirect("/login")
  }

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: (session.user as UserWithRole).role || "user",
    image: session.user.image ?? null,
  }

  return <DashboardShell user={user}>{children}</DashboardShell>
}
