"use client"

import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/format"

import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"

interface Order {
  id: string
  userId: string
  paymentId: string
  planId: string
  licenseQuantity: number
  contactName: string
  status: string
  createdAt: Date
  updatedAt: Date
  userEmail: string | null
  planName: string | null
  planMode: "monthly" | "yearly" | "free" | "lifetime" | null
  planHasYearlyPlan: boolean | null
}

interface AdminOrdersClientProps {
  data: Order[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  initialSearch: string
}

function statusVariant(status: string) {
  switch (status) {
    case "completed":
    case "fulfilled":
      return "default" as const
    case "pending":
      return "secondary" as const
    case "cancelled":
    case "failed":
      return "destructive" as const
    default:
      return "outline" as const
  }
}

export function AdminOrdersClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  initialSearch,
}: AdminOrdersClientProps) {
  const router = useRouter()

  function handleSearchChange(value: string) {
    const params = new URLSearchParams()
    if (value) params.set("search", value)
    if (pageSize !== 10) params.set("limit", String(pageSize))
    params.set("page", "1")
    router.push(`/admin/orders?${params.toString()}`)
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams()
    if (initialSearch) params.set("search", initialSearch)
    if (pageSize !== 10) params.set("limit", String(pageSize))
    params.set("page", String(newPage))
    router.push(`/admin/orders?${params.toString()}`)
  }

  const columns: DataTableColumn<Order>[] = [
    {
      key: "contactName",
      header: "Contact Name",
      render: (row) => <span className="font-medium">{row.contactName}</span>,
    },
    {
      key: "userEmail",
      header: "User Email",
      render: (row) => row.userEmail ?? "-",
    },
    {
      key: "planId",
      header: "Plan",
      render: (row) => {
        const cycle =
          row.planMode === "lifetime"
            ? "Lifetime"
            : row.planMode === "yearly"
              ? "Yearly"
              : row.planMode === "free"
                ? "Free"
                : "Monthly"
        return (
          <div className="flex flex-col">
            <span className="font-medium">{row.planName ?? "-"}</span>
            <span className="text-xs text-muted-foreground">
              {cycle}
              {row.planHasYearlyPlan ? " · Base plan" : ""}
            </span>
          </div>
        )
      },
    },
    {
      key: "licenseQuantity",
      header: "Quantity",
      render: (row) => row.licenseQuantity,
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
    <DataTable<Order>
      columns={columns}
      data={data}
      total={total}
      page={page}
      pageSize={pageSize}
      totalPages={totalPages}
      searchValue={initialSearch}
      searchPlaceholder="Search by email, plan, contact, or status..."
      onSearchChange={handleSearchChange}
      onPageChange={handlePageChange}
      emptyMessage="No orders found."
    />
  )
}
