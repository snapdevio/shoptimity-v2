export const dynamic = "force-dynamic"

import { getMetadata } from "@/lib/metadata"
import { adminGetAuditLogs } from "@/actions/admin"
import { AdminAuditLogsClient } from "./admin-audit-logs-client"

export const metadata = getMetadata({
  title: "Audit Logs",
  description:
    "Review administrative activity, system events, and platform audit history in Shoptimity.",
  pathname: "/admin/audit-logs",
  robots: { index: false, follow: false },
})

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; limit?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const search = params.search || ""
  const limit = parseInt(params.limit || "10", 10)

  const result = await adminGetAuditLogs(page, search, limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Audit Logs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review all system activity and administrative actions.
        </p>
      </div>

      <AdminAuditLogsClient
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
