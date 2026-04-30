"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, ChevronRight } from "lucide-react"
import { Drawer } from "vaul"
import { cn } from "@/lib/utils"
import {
  Users,
  KeyRound,
  CreditCard,
  Globe,
  ShoppingCart,
  ScrollText,
  Mail,
  Settings,
  DollarSign,
  ChartBarStacked,
  ChartColumnStacked,
  BookDashed,
  LayoutDashboard,
  Webhook,
} from "lucide-react"

const ADMIN_NAV = [
  {
    group: "General",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
  {
    group: "Users & Access",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Licenses", href: "/admin/licenses", icon: KeyRound },
      { label: "Contacts", href: "/admin/contacts", icon: Mail },
    ],
  },
  {
    group: "Commerce",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Plans", href: "/admin/plans", icon: DollarSign },
    ],
  },
  {
    group: "Platform",
    items: [
      { label: "Templates", href: "/admin/templates", icon: BookDashed },
      { label: "Domains", href: "/admin/domains", icon: Globe },
      {
        label: "Categories",
        href: "/admin/feature-categories",
        icon: ChartBarStacked,
      },
      { label: "Features", href: "/admin/features", icon: ChartColumnStacked },
      { label: "Webhooks", href: "/admin/webhooks", icon: Webhook },
    ],
  },
]

export function AdminMobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const currentItem = ADMIN_NAV.flatMap((g) => g.items).find((i) =>
    i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href)
  )

  return (
    <div className="mb-6 lg:hidden">
      <Drawer.Root open={open} onOpenChange={setOpen} direction="bottom">
        <Drawer.Trigger asChild>
          <button className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-border/50 bg-card/50 p-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {currentItem?.icon ? (
                  <currentItem.icon className="size-4" />
                ) : (
                  <Menu className="size-4" />
                )}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Admin Menu
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {currentItem?.label || "Select Option"}
                </p>
              </div>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </button>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <Drawer.Content className="fixed right-0 bottom-0 left-0 z-50 flex max-h-[85%] flex-col rounded-t-[32px] bg-background shadow-2xl outline-none">
            <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-muted" />
            <div className="overflow-y-auto p-6 pb-12">
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight">
                  Admin Navigation
                </h2>
                <p className="text-sm text-muted-foreground">
                  Select a section to manage
                </p>
              </div>
              <div className="space-y-8">
                {ADMIN_NAV.map((group) => (
                  <div key={group.group} className="space-y-3">
                    <h4 className="px-2 text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
                      {group.group}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {group.items.map((item) => {
                        const isActive =
                          item.href === "/admin"
                            ? pathname === "/admin"
                            : pathname.startsWith(item.href)

                        return (
                          <Drawer.Close key={item.href} asChild>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex cursor-pointer items-center justify-between rounded-2xl p-4 transition-all active:scale-[0.98]",
                                isActive
                                  ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={cn(
                                    "flex size-10 items-center justify-center rounded-xl transition-colors",
                                    isActive
                                      ? "bg-primary/20"
                                      : "bg-background shadow-sm"
                                  )}
                                >
                                  <item.icon className="size-5" />
                                </div>
                                <span className="font-bold">{item.label}</span>
                              </div>
                              {isActive && (
                                <div className="size-2 rounded-full bg-primary" />
                              )}
                            </Link>
                          </Drawer.Close>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  )
}
