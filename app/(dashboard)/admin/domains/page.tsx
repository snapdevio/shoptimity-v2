export const dynamic = "force-dynamic"

import { getMetadata } from "@/lib/metadata"
import { adminGetDomains } from "@/actions/admin"
import { AdminDomainsClient } from "./admin-domains-client"

export const metadata = getMetadata({
  title: "Domains",
  description:
    "View and manage all registered domains and their connection status for your Shoptimity installs.",
  pathname: "/admin/domains",
  robots: { index: false, follow: false },
})

export default async function AdminDomainsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; limit?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const search = params.search || ""
  const limit = parseInt(params.limit || "10", 10)

  const result = await adminGetDomains(page, search, limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Domains
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View all registered domains and their status.
        </p>
      </div>

      <AdminDomainsClient
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
