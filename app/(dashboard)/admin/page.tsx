export const dynamic = "force-dynamic"

import Link from "next/link"
import {
  Users,
  KeyRound,
  CreditCard,
  Globe,
  ShoppingCart,
  ScrollText,
  Mail,
  PlayCircle,
} from "lucide-react"
import { db } from "@/db"
import {
  users,
  licenses,
  payments,
  domains,
  orders,
  auditLogs,
  plans,
  contacts,
  templates,
} from "@/db/schema"
import { count } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

async function getStats(): Promise<Record<string, number>> {
  const [
    [totalUsers],
    [totalLicenses],
    [totalPayments],
    [totalDomains],
    [totalOrders],
    [totalAuditLogs],
    [totalPlans],
    [totalContacts],
    [totalTemplates],
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(licenses),
    db.select({ value: count() }).from(payments),
    db.select({ value: count() }).from(domains),
    db.select({ value: count() }).from(orders),
    db.select({ value: count() }).from(auditLogs),
    db.select({ value: count() }).from(plans),
    db.select({ value: count() }).from(contacts),
    db.select({ value: count() }).from(templates),
  ])

  return {
    users: totalUsers?.value ?? 0,
    licenses: totalLicenses?.value ?? 0,
    payments: totalPayments?.value ?? 0,
    domains: totalDomains?.value ?? 0,
    orders: totalOrders?.value ?? 0,
    auditLogs: totalAuditLogs?.value ?? 0,
    plans: totalPlans?.value ?? 0,
    contacts: totalContacts?.value ?? 0,
    templates: totalTemplates?.value ?? 0,
  }
}

const sections = [
  {
    title: "Users",
    description: "Manage user accounts and roles",
    href: "/admin/users",
    icon: Users,
    statKey: "users" as const,
  },
  {
    title: "Licenses",
    description: "View and manage licenses",
    href: "/admin/licenses",
    icon: KeyRound,
    statKey: "licenses" as const,
  },
  {
    title: "Payments",
    description: "View payment transactions",
    href: "/admin/payments",
    icon: CreditCard,
    statKey: "payments" as const,
  },
  {
    title: "Domains",
    description: "Manage registered domains",
    href: "/admin/domains",
    icon: Globe,
    statKey: "domains" as const,
  },
  {
    title: "Orders",
    description: "View and manage orders",
    href: "/admin/orders",
    icon: ShoppingCart,
    statKey: "orders" as const,
  },
  {
    title: "Audit Logs",
    description: "Review system activity",
    href: "/admin/audit-logs",
    icon: ScrollText,
    statKey: "auditLogs" as const,
  },
  {
    title: "Pricing Plans",
    description: "Manage pricing tiers and links",
    href: "/admin/plans",
    icon: ShoppingCart,
    statKey: "plans" as const,
  },
  {
    title: "Templates",
    description: "Manage templates",
    href: "/admin/templates",
    icon: ShoppingCart,
    statKey: "templates" as const,
  },
  {
    title: "Contact Requests",
    description: "View and manage user messages",
    href: "/admin/contacts",
    icon: Mail,
    statKey: "contacts" as const,
  },
]

export default async function AdminDashboardPage() {
  const stats = await getStats()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of the system and quick access to admin sections.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href} className="group">
              <Card className="gap-2 transition-colors group-hover:border-foreground/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      {section.title}
                    </CardTitle>
                    <span className="font-heading text-2xl font-semibold">
                      {section.statKey
                        ? stats[section.statKey].toLocaleString()
                        : ""}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
