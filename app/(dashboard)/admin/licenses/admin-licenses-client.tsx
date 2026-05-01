"use client"

import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/format"
import { useState, useTransition } from "react"
import { Ban, Eye, Globe } from "lucide-react"
import { toast } from "sonner"

import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { adminRevokeLicense, adminGetLicenseDomains } from "@/actions/admin"

interface License {
  id: string
  userId: string
  planId: string
  totalSlots: number
  status: string
  sourceOrderId: string | null
  revokedReason: string | null
  billingCycle: "monthly" | "yearly" | "lifetime"
  isLifetime: boolean
  isTrial: boolean
  trialEndsAt: Date | null
  stripeSubscriptionId: string | null
  nextRenewalDate: Date | null
  retentionDiscountUsed: boolean
  retentionDiscountEndsAt: Date | null
  cancelAtPeriodEnd: boolean
  cancellationReason: string | null
  cancellationDetails: string | null
  cancelledAt: Date | null
  createdAt: Date
  updatedAt: Date
  userEmail: string | null
  planName: string | null
  planMode: "monthly" | "yearly" | "free" | "lifetime" | null
  planHasYearlyPlan: boolean | null
}

interface DomainEntry {
  id: string
  domainName: string
  createdAt: Date
  deletedAt: Date | null
}

interface AdminLicensesClientProps {
  data: License[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  initialSearch: string
}

function statusVariant(status: string) {
  switch (status) {
    case "active":
      return "default" as const
    case "trialing":
      return "secondary" as const
    case "revoked":
      return "destructive" as const
    default:
      return "secondary" as const
  }
}

export function AdminLicensesClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  initialSearch,
}: AdminLicensesClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewLicense, setViewLicense] = useState<License | null>(null)
  const [domains, setDomains] = useState<DomainEntry[]>([])
  const [isLoadingDomains, setIsLoadingDomains] = useState(false)

  function handleSearchChange(value: string) {
    const params = new URLSearchParams()
    if (value) params.set("search", value)
    if (pageSize !== 10) params.set("limit", String(pageSize))
    params.set("page", "1")
    router.push(`/admin/licenses?${params.toString()}`)
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams()
    if (initialSearch) params.set("search", initialSearch)
    if (pageSize !== 10) params.set("limit", String(pageSize))
    params.set("page", String(newPage))
    router.push(`/admin/licenses?${params.toString()}`)
  }

  function handleRevoke() {
    if (!selectedLicense) return
    startTransition(async () => {
      const result = await adminRevokeLicense(selectedLicense.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("License revoked successfully")
        router.refresh()
      }
      setRevokeDialogOpen(false)
      setSelectedLicense(null)
    })
  }

  async function handleViewOpen(license: License) {
    setViewLicense(license)
    setDomains([])
    setViewDialogOpen(true)
    setIsLoadingDomains(true)
    try {
      const result = await adminGetLicenseDomains(license.id)
      setDomains(result)
    } catch {
      toast.error("Failed to load domains")
    } finally {
      setIsLoadingDomains(false)
    }
  }

  const columns: DataTableColumn<License>[] = [
    {
      key: "userEmail",
      header: "User Email",
      render: (row) => (
        <span className="font-medium">{row.userEmail ?? "-"}</span>
      ),
    },
    {
      key: "planId",
      header: "Plan",
      render: (row) => {
        const cycle = row.isLifetime
          ? "Lifetime"
          : row.billingCycle === "yearly"
            ? "Yearly"
            : row.billingCycle === "monthly"
              ? "Monthly"
              : null
        return (
          <div className="flex flex-col">
            <span className="font-medium">{row.planName ?? "-"}</span>
            <span className="text-xs text-muted-foreground">
              {cycle ?? "-"}
              {row.isTrial ? " · Trial" : ""}
              {row.planHasYearlyPlan && row.billingCycle === "yearly"
                ? " · Base plan"
                : ""}
            </span>
          </div>
        )
      },
    },
    {
      key: "totalSlots",
      header: "Total Slots",
      render: (row) => row.totalSlots,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={statusVariant(row.status)} className="capitalize">
          {row.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created At",
      render: (row) => formatDate(row.createdAt),
    },
  ]

  const activeDomains = domains.filter((d) => !d.deletedAt)
  const removedDomains = domains.filter((d) => d.deletedAt)
  const billingCycleLabel = viewLicense?.isLifetime
    ? "Lifetime"
    : viewLicense?.billingCycle
      ? viewLicense.billingCycle.charAt(0).toUpperCase() +
        viewLicense.billingCycle.slice(1)
      : "-"

  return (
    <>
      <DataTable<License>
        columns={columns}
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        searchValue={initialSearch}
        searchPlaceholder="Search by email, plan, or status..."
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        emptyMessage="No licenses found."
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleViewOpen(row)}
              title="View license details"
            >
              <Eye className="size-4" />
            </Button>
            {row.status === "active" && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setSelectedLicense(row)
                  setRevokeDialogOpen(true)
                }}
                disabled={isPending}
                title="Revoke license"
              >
                <Ban className="size-4" />
              </Button>
            )}
          </div>
        )}
      />

      {/* License Detail Dialog */}
      <Dialog
        open={viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open)
          if (!open) setViewLicense(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>License Details</DialogTitle>
            <DialogDescription>
              {viewLicense?.userEmail ?? "Loading..."}
            </DialogDescription>
          </DialogHeader>

          {viewLicense && (
            <ScrollArea className="max-h-[65vh]">
              <div className="space-y-5 pr-2">
                {/* Overview */}
                <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge
                      variant={statusVariant(viewLicense.status)}
                      className="mt-0.5 capitalize"
                    >
                      {viewLicense.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Billing Cycle
                    </p>
                    <p className="font-medium">{billingCycleLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="font-medium">{viewLicense.planName ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Slots</p>
                    <p className="font-medium">{viewLicense.totalSlots}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created At</p>
                    <p className="font-medium">
                      {formatDate(viewLicense.createdAt, "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Updated At</p>
                    <p className="font-medium">
                      {formatDate(viewLicense.updatedAt, "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">
                      Stripe Subscription ID
                    </p>
                    <p className="font-mono text-xs font-medium break-all">
                      {viewLicense.stripeSubscriptionId ?? "-"}
                    </p>
                  </div>
                </div>

                {/* Subscription */}
                <div className="space-y-2">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Subscription
                  </p>
                  <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Next Renewal
                      </p>
                      <p className="font-medium">
                        {viewLicense.nextRenewalDate
                          ? formatDate(
                              viewLicense.nextRenewalDate,
                              "MMM d, yyyy"
                            )
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Trial</p>
                      <p className="font-medium">
                        {viewLicense.isTrial ? "Yes" : "No"}
                      </p>
                    </div>
                    {viewLicense.isTrial && viewLicense.trialEndsAt && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Trial Ends At
                        </p>
                        <p className="font-medium">
                          {formatDate(
                            viewLicense.trialEndsAt,
                            "MMM d, yyyy HH:mm"
                          )}
                        </p>
                      </div>
                    )}
                    {viewLicense.retentionDiscountUsed && (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Retention Discount
                          </p>
                          <p className="font-medium">Applied</p>
                        </div>
                        {viewLicense.retentionDiscountEndsAt && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Discount Ends At
                            </p>
                            <p className="font-medium">
                              {formatDate(
                                viewLicense.retentionDiscountEndsAt,
                                "MMM d, yyyy"
                              )}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Domains */}
                <div className="space-y-2">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Connected Domains
                  </p>
                  {isLoadingDomains ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : domains.length === 0 ? (
                    <p className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                      No domains connected.
                    </p>
                  ) : (
                    <div className="divide-y rounded-lg border text-sm">
                      {activeDomains.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                          <span className="flex items-center gap-2.5">
                            <Globe className="size-4 text-muted-foreground" />
                            <span className="font-medium">{d.domainName}</span>
                          </span>
                          <Badge variant="default" className="text-xs">
                            Active
                          </Badge>
                        </div>
                      ))}
                      {removedDomains.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                          <span className="flex items-center gap-2.5">
                            <Globe className="size-4 text-muted-foreground/50" />
                            <span className="text-muted-foreground line-through">
                              {d.domainName}
                            </span>
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            Removed
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cancellation */}
                {(viewLicense.cancelAtPeriodEnd ||
                  viewLicense.cancellationReason ||
                  viewLicense.cancellationDetails ||
                  viewLicense.cancelledAt) && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Cancellation
                    </p>
                    <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">
                          Scheduled to Cancel
                        </p>
                        {viewLicense.cancelAtPeriodEnd ? (
                          <Badge variant="destructive" className="mt-0.5">
                            Cancel at Period End
                          </Badge>
                        ) : (
                          <p className="font-medium">No</p>
                        )}
                      </div>
                      {viewLicense.cancellationReason && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Reason
                          </p>
                          <p className="font-medium capitalize">
                            {viewLicense.cancellationReason.replace(/_/g, " ")}
                          </p>
                        </div>
                      )}
                      {viewLicense.cancelledAt && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Cancelled At
                          </p>
                          <p className="font-medium">
                            {formatDate(
                              viewLicense.cancelledAt,
                              "MMM d, yyyy HH:mm"
                            )}
                          </p>
                        </div>
                      )}
                      {viewLicense.cancellationDetails && (
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">
                            Details
                          </p>
                          <p className="font-medium">
                            {viewLicense.cancellationDetails}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Revocation */}
                {viewLicense.revokedReason && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Revocation
                    </p>
                    <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                      <p className="text-xs text-muted-foreground">Reason</p>
                      <p className="font-medium capitalize">
                        {viewLicense.revokedReason.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Confirm Dialog */}
      <AlertDialog
        open={revokeDialogOpen}
        onOpenChange={(open) => {
          setRevokeDialogOpen(open)
          if (!open) setSelectedLicense(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke License</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this license for{" "}
              <strong>{selectedLicense?.userEmail}</strong>? This will
              deactivate all associated domains and notify the user. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleRevoke}
              disabled={isPending}
            >
              {isPending ? "Revoking..." : "Revoke License"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
