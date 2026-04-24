"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  KeyRoundIcon,
  LayoutTemplateIcon,
  UserIcon,
  CreditCardIcon,
  ShieldIcon,
  LogOutIcon,
  DollarSignIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface DashboardShellProps {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  children: React.ReactNode
}

const NAV_ITEMS = [
  { href: "/licenses", label: "Licenses", icon: KeyRoundIcon },
  { href: "/templates", label: "Templates", icon: LayoutTemplateIcon },
  { href: "/plans", label: "Plans", icon: DollarSignIcon },
  { href: "/billing", label: "Billing", icon: CreditCardIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
  { href: "/payments", label: "Payment History", icon: CreditCardIcon },
]
export function DashboardShell({ user, children }: DashboardShellProps) {
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const { signOut } = await import("@/lib/auth-client")
    await signOut()
    router.push("/login")
  }

  const displayName = user.name?.trim() ? user.name : user.email

  return (
    <>
      <Sidebar>
        <SidebarHeader className="px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <img
              src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT || ""}/assets/logo.svg`}
              alt="Shoptimity Logo"
              className="h-8 w-auto"
            />
            {/* <span className="font-heading text-xl font-bold tracking-tight">
              Shoptimity
            </span> */}
          </Link>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.label}
                      render={
                        <Link
                          href={item.href}
                          onClick={() => setOpenMobile(false)}
                        />
                      }
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {user.role === "admin" && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={pathname.startsWith("/admin")}
                      tooltip="Admin"
                      render={
                        <Link
                          href="/admin"
                          onClick={() => setOpenMobile(false)}
                        />
                      }
                    >
                      <ShieldIcon />
                      <span>Admin</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase">
              {displayName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {user.role}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-start group-data-[collapsible=icon]:justify-center"
            onClick={handleLogout}
          >
            <LogOutIcon />
            <span className="group-data-[collapsible=icon]:hidden">
              Sign out
            </span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="relative flex h-14 items-center gap-4 border-b px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="md:hidden" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden">
            <Link href="/" className="flex items-center gap-2">
              <img
                src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT || ""}/assets/logo.svg`}
                alt="Shoptimity Logo"
                className="h-8 w-auto"
              />
            </Link>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </>
  )
}
