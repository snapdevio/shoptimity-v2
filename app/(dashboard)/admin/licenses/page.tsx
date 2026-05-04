export const dynamic = "force-dynamic"

import { getMetadata } from "@/lib/metadata"
import { adminGetLicenses } from "@/actions/admin"
import { AdminLicensesClient } from "./admin-licenses-client"

export const metadata = getMetadata({
  title: "Licenses",
  description:
    "View and manage active and expired licenses for Shoptimity store access.",
  pathname: "/admin/licenses",
  robots: { index: false, follow: false },
})

export default async function AdminLicensesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; limit?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const search = params.search || ""
  const limit = parseInt(params.limit || "10", 10)

  const result = await adminGetLicenses(page, search, limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Licenses
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage all licenses, revoke if needed.
        </p>
      </div>

      <AdminLicensesClient
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
