"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatDate } from "@/lib/format"

import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { adminUpdateUserRole } from "@/actions/admin"
import { UserDetailDialog } from "./user-detail-dialog"

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
  currentUserId: string
}

export function AdminUsersClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  initialSearch,
  currentUserId,
}: AdminUsersClientProps) {
  const router = useRouter()
  const [selectedUser, setSelectedUser] = React.useState<{
    id: string
    email: string
  } | null>(null)
  // Per-row pending state so toggling one user doesn't disable all switches.
  const [pendingRoleUserId, setPendingRoleUserId] = React.useState<
    string | null
  >(null)

  function handleRoleToggle(user: User, makeAdmin: boolean) {
    if (user.id === currentUserId) {
      toast.error("You can't change your own role")
      return
    }
    const targetRole: "admin" | "user" = makeAdmin ? "admin" : "user"
    setPendingRoleUserId(user.id)
    adminUpdateUserRole(user.id, targetRole)
      .then((res) => {
        if ("error" in res && res.error) {
          toast.error(res.error)
        } else {
          toast.success(
            `${user.email} is now ${targetRole === "admin" ? "an admin" : "a user"}`
          )
          router.refresh()
        }
      })
      .catch(() => toast.error("Failed to update role"))
      .finally(() => setPendingRoleUserId(null))
  }

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
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedUser({ id: row.id, email: row.email })}
          className="cursor-pointer font-medium text-primary hover:underline"
        >
          {row.email}
        </button>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (row) => row.name,
    },
    {
      key: "role",
      header: "Role",
      render: (row) => {
        const isSelf = row.id === currentUserId
        const isAdmin = row.role === "admin"
        return (
          <div className="flex items-center gap-3">
            <Badge
              variant={isAdmin ? "default" : "secondary"}
              className="capitalize"
            >
              {row.role}
            </Badge>
            {!isSelf && (
              <Switch
                size="sm"
                checked={isAdmin}
                disabled={pendingRoleUserId === row.id}
                onCheckedChange={(next) => handleRoleToggle(row, next)}
                aria-label={`Toggle admin role for ${row.email}`}
              />
            )}
          </div>
        )
      },
    },
    {
      key: "createdAt",
      header: "Created At",
      render: (row) => formatDate(row.createdAt),
    },
  ]

  return (
    <>
      <DataTable<User>
        columns={columns}
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        searchValue={initialSearch}
        searchPlaceholder="Search by email, name, or role..."
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        emptyMessage="No users found."
      />

      <UserDetailDialog
        userId={selectedUser?.id ?? null}
        email={selectedUser?.email ?? null}
        open={selectedUser !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null)
        }}
      />
    </>
  )
}
