export const dynamic = "force-dynamic"

import { getMetadata } from "@/lib/metadata"
import { adminGetWebhookEvents } from "@/actions/admin"
import { AdminWebhooksClient } from "./admin-webhooks-client"

export const metadata = getMetadata({
  title: "Webhooks",
  description:
    "Review recent webhook events, delivery status, and retry logic in the Shoptimity admin.",
  pathname: "/admin/webhooks",
  robots: { index: false, follow: false },
})

export default async function AdminWebhooksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; limit?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const search = params.search || ""
  const limit = parseInt(params.limit || "10", 10)

  const result = await adminGetWebhookEvents(page, search, limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Webhooks
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Inspect inbound webhook events and their processing state.
        </p>
      </div>

      <AdminWebhooksClient
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
