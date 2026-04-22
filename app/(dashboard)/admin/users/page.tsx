export const dynamic = "force-dynamic"

import { adminGetUsers } from "@/actions/admin"
import { AdminUsersClient } from "./admin-users-client"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; limit?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const search = params.search || ""
  const limit = parseInt(params.limit || "10", 10)

  const result = await adminGetUsers(page, search, limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage user accounts, view details, and send magic links.
        </p>
      </div>

      <AdminUsersClient
        data={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        initialSearch={search}
      />
    </div>
  )
}
