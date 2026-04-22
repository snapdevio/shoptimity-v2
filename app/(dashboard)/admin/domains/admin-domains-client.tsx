"use client"

import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/format"

import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"

interface Domain {
  id: string
  licenseId: string
  userId: string
  domainName: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  userEmail: string | null
}

interface AdminDomainsClientProps {
  data: Domain[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  initialSearch: string
}

export function AdminDomainsClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  initialSearch,
}: AdminDomainsClientProps) {
  const router = useRouter()

  function handleSearchChange(value: string) {
    const params = new URLSearchParams()
    if (value) params.set("search", value)
    if (pageSize !== 10) params.set("limit", String(pageSize))
    params.set("page", "1")
    router.push(`/admin/domains?${params.toString()}`)
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams()
    if (initialSearch) params.set("search", initialSearch)
    if (pageSize !== 10) params.set("limit", String(pageSize))
    params.set("page", String(newPage))
    router.push(`/admin/domains?${params.toString()}`)
  }

  const columns: DataTableColumn<Domain>[] = [
    {
      key: "domainName",
      header: "Domain Name",
      render: (row) => <span className="font-medium">{row.domainName}</span>,
    },
    {
      key: "userEmail",
      header: "User Email",
      render: (row) => row.userEmail ?? "-",
    },
    {
      key: "licenseId",
      header: "License ID",
      render: (row) => (
        <span className="font-mono text-xs">
          {row.licenseId.slice(0, 8)}...
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          variant={row.deletedAt ? "destructive" : "default"}
          className="capitalize"
        >
          {row.deletedAt ? "deleted" : "active"}
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
    <DataTable<Domain>
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
      emptyMessage="No domains found."
    />
  )
}
