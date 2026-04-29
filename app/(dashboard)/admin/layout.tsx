import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth, UserWithRole } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const user = session?.user as UserWithRole | undefined

  if (!session || user?.role !== "admin") {
    redirect("/licenses")
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full flex-col gap-0 lg:flex-row lg:gap-8">
      {/* Admin Sidebar (Desktop) */}
      <AdminSidebar />

      {/* Admin Content */}
      <main className="min-w-0 flex-1">
        {/* Mobile Navigation Trigger */}
        <AdminMobileNav />
        {children}
      </main>
    </div>
  )
}
