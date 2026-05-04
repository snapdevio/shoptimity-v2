import { getMetadata } from "@/lib/metadata"
import {
  Users,
  KeyRound,
  Globe,
  ShoppingCart,
  Mail,
  DollarSign,
  BookDashed,
  ArrowRight,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Package,
  Layers,
} from "lucide-react"
import { db } from "@/db"

export const metadata = getMetadata({
  title: "Admin Overview",
  description:
    "Monitor key performance metrics, revenue, and activity across Shoptimity from the admin dashboard.",
  pathname: "/admin",
  robots: { index: false, follow: false },
})
import {
  users,
  licenses,
  payments,
  orders,
  contacts,
  domains,
  templates,
} from "@/db/schema"
import { count, desc, eq, sum, and } from "drizzle-orm"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDateRelative } from "@/lib/format"

async function getStats() {
  const [
    [totalUsers],
    [totalLicenses],
    [revenueData],
    [totalOrders],
    [totalContacts],
    [totalDomains],
    [totalTemplates],
    recentOrders,
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(licenses),
    db
      .select({ value: sum(payments.amount) })
      .from(payments)
      .where(eq(payments.status, "paid")),
    db.select({ value: count() }).from(orders),
    db.select({ value: count() }).from(contacts),
    db.select({ value: count() }).from(domains),
    db.select({ value: count() }).from(templates),
    db
      .select({
        id: orders.id,
        createdAt: orders.createdAt,
        amount: payments.amount,
        status: orders.status,
      })
      .from(orders)
      .innerJoin(payments, eq(orders.paymentId, payments.id))
      .orderBy(desc(orders.createdAt))
      .limit(5),
  ])

  return {
    users: totalUsers?.value ?? 0,
    licenses: totalLicenses?.value ?? 0,
    revenue: Number(revenueData?.value ?? 0) / 100,
    orders: totalOrders?.value ?? 0,
    contacts: totalContacts?.value ?? 0,
    domains: totalDomains?.value ?? 0,
    templates: totalTemplates?.value ?? 0,
    recentOrders: recentOrders ?? [],
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats()

  return (
    <div className="space-y-10 pb-10">
      {/* WELCOME HEADER */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening across Shoptimity
          today.
        </p>
      </div>

      {/* TOP METRICS GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Revenue",
            value: `$${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            trend: "+12.5%",
            trendUp: true,
            color: "text-emerald-500",
            bg: "from-orange-500/20 to-orange-500/5",
          },
          {
            label: "Total Customers",
            value: stats.users.toLocaleString(),
            icon: Users,
            trend: "+5.2%",
            trendUp: true,
            color: "text-blue-500",
            bg: "from-orange-500/20 to-orange-500/5",
          },
          {
            label: "Active Licenses",
            value: stats.licenses.toLocaleString(),
            icon: KeyRound,
            trend: "+8.1%",
            trendUp: true,
            color: "text-orange-500",
            bg: "from-orange-500/20 to-orange-500/5",
          },
          {
            label: "Support Requests",
            value: stats.contacts.toLocaleString(),
            icon: Mail,
            trend: "-2.4%",
            trendUp: false,
            color: "text-purple-500",
            bg: "from-orange-500/20 to-orange-500/5",
          },
        ].map((m) => (
          <Card
            key={m.label}
            className="group relative overflow-hidden border-border/50 bg-card/50 shadow-sm transition-all hover:bg-card/80 hover:shadow-md"
          >
            <div
              className={cn(
                "absolute inset-0 bg-linear-to-br opacity-0 transition-opacity group-hover:opacity-100",
                m.bg
              )}
            />
            <CardContent className="relative z-10 p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-background/50 p-2.5 shadow-sm ring-1 ring-border/50">
                  <m.icon className={cn("size-5", m.color)} />
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight ring-1",
                    m.trendUp
                      ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 ring-rose-500/20"
                  )}
                >
                  {m.trendUp ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {m.trend}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {m.label}
                </p>
                <h3 className="mt-1 text-3xl font-black tracking-tight">
                  {m.value}
                </h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
        {/* RECENT ORDERS TABLE */}
        <Card className="overflow-hidden border-border/50 bg-card/40 shadow-xl backdrop-blur-md lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 bg-muted/20">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Package className="size-5 text-primary" />
                Recent Orders
              </CardTitle>
              <CardDescription>
                Latest transactions in real-time
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-xl">
              <Link href="/admin/orders" className="cursor-pointer">
                View All <ArrowRight className="ml-2 size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-5 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                        <ShoppingCart className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {formatDateRelative(order.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <p className="text-sm font-black text-foreground">
                        $
                        {(order.amount / 100).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-5 rounded-md px-1.5 text-[9px] font-black tracking-widest uppercase",
                          order.status === "success" || order.status === "paid"
                            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600"
                            : "border-amber-500/30 bg-amber-500/5 text-amber-600"
                        )}
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="rounded-full bg-muted p-4 text-muted-foreground">
                    <ShoppingCart className="size-8" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-muted-foreground">
                    No recent orders found
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PLATFORM STATUS */}
        <Card className="flex flex-col border-border/50 bg-card/40 shadow-xl backdrop-blur-md lg:col-span-3">
          <CardHeader className="border-b border-border/30 bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Activity className="size-5 text-primary" />
              Platform Status
            </CardTitle>
            <CardDescription>Real-time system health metrics</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-8 p-8">
            {[
              {
                label: "Domain Slots",
                value: stats.domains,
                icon: Globe,
                max: 1000,
                color: "bg-blue-500",
                description: "Total linked Shopify stores",
              },
              {
                label: "Library Templates",
                value: stats.templates,
                icon: BookDashed,
                max: 50,
                color: "bg-purple-500",
                description: "Premium themes in catalog",
              },
              {
                label: "Platform Sections",
                value: 84,
                icon: Layers,
                max: 100,
                color: "bg-orange-500",
                description: "Available widget components",
              },
            ].map((s) => (
              <div key={s.label} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground ring-1 ring-border/50">
                      <s.icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm leading-none font-bold">
                        {s.label}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {s.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black">{s.value}</span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      / {s.max}
                    </span>
                  </div>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted shadow-inner">
                  <div
                    className={cn(
                      "absolute top-0 bottom-0 left-0 rounded-full transition-all duration-1000 ease-out",
                      s.color
                    )}
                    style={{
                      width: `${Math.min(100, (s.value / s.max) * 100)}%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-white/20 to-transparent" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
