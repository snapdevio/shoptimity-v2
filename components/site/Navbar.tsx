"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import { useSession } from "@/lib/auth-client"
import { Menu, X } from "lucide-react"
import { Drawer } from "vaul"

const Navbar: React.FC<{ isLoggedIn?: boolean }> = ({
  isLoggedIn: initialIsLoggedIn = false,
}) => {
  const pathname = usePathname()
  const { data: session, isPending } = useSession()

  // Use server-side state during loading/hydration to prevent flicker
  const isLoggedIn = isPending ? initialIsLoggedIn : !!session

  const authButtonText = isLoggedIn ? "Dashboard" : "Login"
  const authButtonHref = isLoggedIn ? "/licenses" : "/login"

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Pricing", href: "/pricing" },
    { name: "Setup Guide", href: "/setup" },
    { name: "Blogs", href: "/blogs" },
    { name: "Contact", href: "/contact" },
  ]

  return (
    <header className="sticky top-0 z-50 border-b bg-base-100/90 px-4 py-4 backdrop-blur-md sm:px-6 md:px-10 lg:px-25">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80"
          >
            <img
              src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT || ""}/assets/logo.svg`}
              alt="Shoptimity Logo"
              className="h-auto w-auto"
            />
            {/* <span className="inline text-2xl font-bold tracking-tight">
              Shoptimity
            </span> */}
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 font-sans md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "cursor-pointer text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href
                  ? "border-b-2 border-primary pb-0.5 text-primary"
                  : "text-base-content-muted"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={authButtonHref}
            className={cn(
              "cursor-pointer",
              buttonVariants({ variant: "default", size: "lg" }),
              "rounded-full px-4 font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg md:px-8"
            )}
          >
            {authButtonText}
          </Link>

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
                <Drawer.Title className="sr-only">Navigation Menu</Drawer.Title>
                <Drawer.Description className="sr-only">
                  Access home, plans, setup guide, and contact pages.
                </Drawer.Description>
                <div className="flex h-full flex-col bg-base-300">
                  <div className="flex items-center justify-between border-b p-6">
                    {/* <span className="text-xl font-bold tracking-tight">Menu</span> */}
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
                        {/* <span className="text-xl font-bold tracking-tight md:inline">
                          Shoptimity
                        </span> */}
                      </Link>
                    </Drawer.Close>
                    <Drawer.Close asChild>
                      <button className="cursor-pointer rounded-full p-2 text-base-content-muted transition-colors hover:bg-base-200 hover:text-base-content">
                        <X className="h-6 w-6" />
                      </button>
                    </Drawer.Close>
                  </div>

                  <nav className="flex flex-col gap-6 overflow-y-auto p-6 font-sans">
                    {navLinks.map((link) => (
                      <Drawer.Close key={link.name} asChild>
                        <Link
                          href={link.href}
                          className={cn(
                            "cursor-pointer border-b border-base-100 pb-4 text-xl font-medium transition-colors",
                            pathname === link.href
                              ? "text-primary"
                              : "text-base-content-muted hover:text-primary"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            {link.name}
                            {pathname === link.href && (
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </div>
                        </Link>
                      </Drawer.Close>
                    ))}
                  </nav>

                  <div className="mt-auto flex flex-col gap-3 border-t p-6">
                    <Drawer.Close asChild>
                      <Link
                        href={authButtonHref}
                        className={cn(
                          "cursor-pointer",
                          buttonVariants({ variant: "outline", size: "lg" }),
                          "w-full rounded-full font-semibold"
                        )}
                      >
                        {authButtonText}
                      </Link>
                    </Drawer.Close>
                  </div>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        </div>
      </div>
    </header>
  )
}

export default Navbar
