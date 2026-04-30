"use client"

import { useRouter } from "next/navigation"
import { formatDate, formatCurrency } from "@/lib/format"

import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"

interface Payment {
  id: string
  userId: string
  stripeSessionId: string
  stripePaymentIntentId: string | null
  stripeCustomerId: string | null
  amount: number
  currency: string
  status: string
  createdAt: Date
  updatedAt: Date
  userEmail: string | null
}

interface AdminPaymentsClientProps {
  data: Payment[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  initialSearch: string
}

function statusVariant(status: string) {
  switch (status) {
    case "succeeded":
    case "paid":
      return "default" as const
    case "pending":
      return "secondary" as const
    case "failed":
    case "refunded":
      return "destructive" as const
    default:
      return "outline" as const
  }
}

export function AdminPaymentsClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  initialSearch,
}: AdminPaymentsClientProps) {
  const router = useRouter()

  function handleSearchChange(value: string) {
    const params = new URLSearchParams()
    if (value) params.set("search", value)
    if (pageSize !== 10) params.set("limit", String(pageSize))
    params.set("page", "1")
    router.push(`/admin/payments?${params.toString()}`)
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams()
    if (initialSearch) params.set("search", initialSearch)
    if (pageSize !== 10) params.set("limit", String(pageSize))
    params.set("page", String(newPage))
    router.push(`/admin/payments?${params.toString()}`)
  }

  const columns: DataTableColumn<Payment>[] = [
    {
      key: "createdAt",
      header: "Date",
      render: (row) => formatDate(row.createdAt, "MMM d, yyyy HH:mm"),
    },
    {
      key: "userEmail",
      header: "User Email",
      render: (row) => (
        <span className="font-medium">{row.userEmail ?? "-"}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => (
        <span className="font-medium">
          {formatCurrency(row.amount, row.currency)}
        </span>
      ),
    },
    {
      key: "currency",
      header: "Currency",
      render: (row) => (
        <span className="text-xs uppercase">{row.currency}</span>
      ),
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
      key: "stripeSessionId",
      header: "Stripe Session ID",
      render: (row) => (
        <span className="block max-w-[200px] truncate font-mono text-xs">
          {row.stripeSessionId}
        </span>
      ),
    },
  ]

  return (
    <DataTable<Payment>
      columns={columns}
      data={data}
      total={total}
      page={page}
      pageSize={pageSize}
      totalPages={totalPages}
      searchValue={initialSearch}
      searchPlaceholder="Search by email, status, or session ID..."
      onSearchChange={handleSearchChange}
      onPageChange={handlePageChange}
      emptyMessage="No payments found."
    />
  )
}
