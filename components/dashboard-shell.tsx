"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  UserIcon,
  ShieldIcon,
  LogOutIcon,
  KeyRoundIcon,
  LayoutTemplateIcon,
  DollarSignIcon,
  CreditCardIcon,
  LockIcon,
  Menu,
  X,
  ChevronDown,
} from "lucide-react"
import { Drawer } from "vaul"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface DashboardShellProps {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  children: React.ReactNode
}

const NAV_TABS = [
  { href: "/licenses", label: "Licenses", icon: KeyRoundIcon },
  { href: "/templates", label: "Templates", icon: LayoutTemplateIcon },
  { href: "/plans", label: "Plans", icon: DollarSignIcon },
  { href: "/billing", label: "Billing", icon: CreditCardIcon },
]

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [showMobileProfile, setShowMobileProfile] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const { signOut } = await import("@/lib/auth-client")
    await signOut()
    router.push("/login")
  }

  const displayName = user.name?.trim() ? user.name : user.email
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-base-100/90 px-4 py-4 backdrop-blur-md sm:px-6 md:px-10 lg:px-25">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-10">
            <Link
              href="/"
              className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80"
            >
              <img
                src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT || ""}/assets/logo.svg`}
                alt="Shoptimity Logo"
                className="h-8 w-auto"
              />
            </Link>
          </div>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
            {NAV_TABS.map((tab) => {
              const isActive = pathname.startsWith(tab.href)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex cursor-pointer items-center rounded-md px-4 py-2 text-sm font-medium transition-all hover:bg-muted/50",
                    isActive
                      ? "bg-muted text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 cursor-pointer rounded-full ring-offset-background transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="bg-primary/5 text-xs font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="px-2 py-1.5">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm leading-none font-medium">
                        {displayName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex cursor-pointer items-center"
                    >
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Manage Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile/change-password"
                      className="flex cursor-pointer items-center"
                    >
                      <LockIcon className="mr-2 h-4 w-4" />
                      <span>Change Password</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin"
                        className="flex cursor-pointer items-center"
                      >
                        <ShieldIcon className="mr-2 h-4 w-4" />
                        <span>Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex cursor-pointer items-center text-destructive focus:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Toggle using Vaul */}
            <Drawer.Root direction="right">
              <Drawer.Trigger asChild className="md:hidden">
                <button
                  className="cursor-pointer p-1 text-base-content-muted hover:text-base-content focus:outline-none sm:p-2"
                  aria-label="Open Menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </Drawer.Trigger>
              <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm" />
                <Drawer.Content className="fixed right-0 bottom-0 z-70 flex h-full w-[80%] max-w-[320px] flex-col rounded-l-2xl bg-base-300 shadow-2xl outline-none">
                  <Drawer.Title className="sr-only">
                    Dashboard Menu
                  </Drawer.Title>
                  <Drawer.Description className="sr-only">
                    Access dashboard sections like licenses, templates, and
                    billing.
                  </Drawer.Description>
                  <div className="flex h-full flex-col bg-base-300">
                    <div className="flex items-center justify-between border-b p-6">
                      <Drawer.Close asChild>
                        <Link
                          href="/"
                          className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80"
                        >
                          <img
                            src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT || ""}/assets/logo.svg`}
                            alt="Shoptimity Logo"
                            className="h-8 w-auto"
                          />
                        </Link>
                      </Drawer.Close>
                      <Drawer.Close asChild>
                        <button className="cursor-pointer rounded-full p-2 text-base-content-muted transition-colors hover:bg-base-200 hover:text-base-content">
                          <X className="h-6 w-6" />
                        </button>
                      </Drawer.Close>
                    </div>

                    <nav className="flex flex-col gap-6 overflow-y-auto p-6 font-sans">
                      {NAV_TABS.map((tab) => (
                        <Drawer.Close key={tab.href} asChild>
                          <Link
                            href={tab.href}
                            className={cn(
                              "cursor-pointer border-b border-base-100 pb-4 text-xl font-medium transition-colors",
                              pathname.startsWith(tab.href)
                                ? "text-primary"
                                : "text-base-content-muted hover:text-primary"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {tab.label}
                              </div>
                              {pathname.startsWith(tab.href) && (
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                              )}
                            </div>
                          </Link>
                        </Drawer.Close>
                      ))}
                    </nav>

                    <div className="mt-auto border-t p-6">
                      <button
                        onClick={() => setShowMobileProfile(!showMobileProfile)}
                        className="mb-4 flex w-full cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarFallback className="bg-primary/5 text-xs font-semibold text-primary">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-start space-y-0.5">
                            <p className="text-sm leading-none font-medium">
                              {displayName}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={cn(
                            "size-5 text-muted-foreground transition-transform",
                            showMobileProfile ? "rotate-180" : ""
                          )}
                        />
                      </button>

                      {showMobileProfile && (
                        <nav className="flex animate-in flex-col gap-1 px-2 duration-200 fade-in slide-in-from-top-2">
                          <Drawer.Close asChild>
                            <Link
                              href="/profile"
                              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-muted"
                            >
                              <UserIcon className="size-4 text-muted-foreground" />
                              Manage Profile
                            </Link>
                          </Drawer.Close>
                          <Drawer.Close asChild>
                            <Link
                              href="/profile/change-password"
                              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-muted"
                            >
                              <LockIcon className="size-4 text-muted-foreground" />
                              Change Password
                            </Link>
                          </Drawer.Close>
                          {user.role === "admin" && (
                            <Drawer.Close asChild>
                              <Link
                                href="/admin"
                                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-muted"
                              >
                                <ShieldIcon className="size-4 text-muted-foreground" />
                                Admin
                              </Link>
                            </Drawer.Close>
                          )}
                          <Drawer.Close asChild>
                            <button
                              onClick={handleLogout}
                              className="mt-2 flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                            >
                              <LogOutIcon className="size-4" />
                              Logout
                            </button>
                          </Drawer.Close>
                        </nav>
                      )}
                    </div>
                  </div>
                </Drawer.Content>
              </Drawer.Portal>
            </Drawer.Root>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-6 md:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
