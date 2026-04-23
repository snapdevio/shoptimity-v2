import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth, UserWithRole } from "@/lib/auth"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  // Check if session exists and role is admin
  const user = session?.user as UserWithRole | undefined

  if (process.env.NODE_ENV !== "development") {
    if (!session || user?.role !== "admin") {
      redirect("/licenses")
    }
  }

  return <>{children}</>
}
