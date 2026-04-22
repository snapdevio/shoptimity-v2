"use client"

import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/format"
import { useState, useTransition } from "react"
import { Ban } from "lucide-react"
import { toast } from "sonner"

import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { adminRevokeLicense } from "@/actions/admin"

interface License {
  id: string
  userId: string
  planId: string
  totalSlots: number
  status: string
  sourceOrderId: string | null
  revokedReason: string | null
  createdAt: Date
  updatedAt: Date
  userEmail: string | null
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
      render: (row) => (
        <span className="font-mono text-xs">{row.planId.slice(0, 8)}...</span>
      ),
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
        searchPlaceholder="Search by..."
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        emptyMessage="No licenses found."
        actions={(row) =>
          row.status === "active" ? (
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
          ) : null
        }
      />

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
