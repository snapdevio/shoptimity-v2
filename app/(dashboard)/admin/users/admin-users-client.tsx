"use client"

import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/format"

import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
  updatedAt: Date
  emailVerified: boolean
  image: string | null
}

interface AdminUsersClientProps {
  data: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  initialSearch: string
}

export function AdminUsersClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  initialSearch,
}: AdminUsersClientProps) {
  const router = useRouter()

  function handleSearchChange(value: string) {
    const params = new URLSearchParams()
    if (value) params.set("search", value)
    if (pageSize !== 10) params.set("limit", String(pageSize))
    params.set("page", "1")
    router.push(`/admin/users?${params.toString()}`)
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams()
    if (initialSearch) params.set("search", initialSearch)
    if (pageSize !== 10) params.set("limit", String(pageSize))
    params.set("page", String(newPage))
    router.push(`/admin/users?${params.toString()}`)
  }

  const columns: DataTableColumn<User>[] = [
    {
      key: "email",
      header: "Email",
      render: (row) => <span className="font-medium">{row.email}</span>,
    },
    {
      key: "name",
      header: "Name",
      render: (row) => row.name,
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <Badge
          variant={row.role === "admin" ? "default" : "secondary"}
          className="capitalize"
        >
          {row.role}
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
    <DataTable<User>
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
      emptyMessage="No users found."
    />
  )
}
