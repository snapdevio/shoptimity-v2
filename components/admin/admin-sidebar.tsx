"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
import { cn } from "@/lib/utils"

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

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-24 hidden h-fit w-64 shrink-0 flex-col gap-6 lg:flex">
      {ADMIN_NAV.map((group) => (
        <div key={group.group} className="space-y-2">
          <h4 className="px-3 text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase">
            {group.group}
          </h4>
          <nav className="flex flex-col gap-1">
            {group.items.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn("size-4", isActive ? "text-primary" : "")}
                  />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      ))}
    </aside>
  )
}
