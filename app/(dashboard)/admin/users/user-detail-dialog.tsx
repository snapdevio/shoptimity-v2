"use client"

import * as React from "react"
import Link from "next/link"
import {
  KeyRound,
  CreditCard,
  Globe,
  ScrollText,
  ShoppingBag,
  ChevronRight,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/format"
import { adminGetUserSummary } from "@/actions/admin"

interface UserSummary {
  user: {
    id: string
    name: string
    email: string
    role: string
    emailVerified: boolean
    loginMode: string | null
    company: string | null
    country: string | null
    createdAt: Date
    updatedAt: Date
  }
  counts: {
    licenses: number
    payments: number
    orders: number
    domains: number
    auditLogs: number
  }
}

interface UserDetailDialogProps {
  userId: string | null
  email: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetailDialog({
  userId,
  email,
  open,
  onOpenChange,
}: UserDetailDialogProps) {
  const [summary, setSummary] = React.useState<UserSummary | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open || !userId) {
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    setSummary(null)
    adminGetUserSummary(userId)
      .then((result) => {
        if (cancelled) return
        if ("error" in result && result.error) {
          setError(result.error)
        } else if ("user" in result) {
          setSummary(result)
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load user details")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, userId])

  const searchEmail = summary?.user.email ?? email ?? ""
  const encodedEmail = encodeURIComponent(searchEmail)

  const sections: {
    label: string
    icon: React.ElementType
    href: string
    count: number
  }[] = summary
    ? [
        {
          label: "Licenses",
          icon: KeyRound,
          href: `/admin/licenses?search=${encodedEmail}`,
          count: summary.counts.licenses,
        },
        {
          label: "Orders",
          icon: ShoppingBag,
          href: `/admin/orders?search=${encodedEmail}`,
          count: summary.counts.orders,
        },
        {
          label: "Payments",
          icon: CreditCard,
          href: `/admin/payments?search=${encodedEmail}`,
          count: summary.counts.payments,
        },
        {
          label: "Domains",
          icon: Globe,
          href: `/admin/domains?search=${encodedEmail}`,
          count: summary.counts.domains,
        },
        {
          label: "Audit Logs",
          icon: ScrollText,
          href: `/admin/audit-logs?search=${encodedEmail}`,
          count: summary.counts.auditLogs,
        },
      ]
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            {email ?? summary?.user.email ?? "Loading user..."}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {summary && !loading && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{summary.user.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <Badge
                  variant={
                    summary.user.role === "admin" ? "default" : "secondary"
                  }
                  className="capitalize"
                >
                  {summary.user.role}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email Verified</p>
                <p className="font-medium">
                  {summary.user.emailVerified ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Login Mode</p>
                <p className="font-medium capitalize">
                  {summary.user.loginMode || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Company</p>
                <p className="font-medium">{summary.user.company || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Country</p>
                <p className="font-medium">{summary.user.country || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Created At</p>
                <p className="font-medium">
                  {formatDate(summary.user.createdAt, "MMM d, yyyy HH:mm")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Related Records
              </p>
              <div className="divide-y rounded-lg border">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <Link
                      key={section.label}
                      href={section.href}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="size-4 text-muted-foreground" />
                        <span className="font-medium">{section.label}</span>
                      </span>
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-mono text-xs">
                          {section.count}
                        </span>
                        <ChevronRight className="size-4" />
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
