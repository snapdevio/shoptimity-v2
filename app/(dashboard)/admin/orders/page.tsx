export const dynamic = "force-dynamic"

import { getMetadata } from "@/lib/metadata"
import { adminGetOrders } from "@/actions/admin"
import { AdminOrdersClient } from "./admin-orders-client"

export const metadata = getMetadata({
  title: "Orders",
  description:
    "Review all customer orders and order processing status in the Shoptimity admin dashboard.",
  pathname: "/admin/orders",
  robots: { index: false, follow: false },
})

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; limit?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const search = params.search || ""
  const limit = parseInt(params.limit || "10", 10)

  const result = await adminGetOrders(page, search, limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Orders
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View all orders and their processing status.
        </p>
      </div>

      <AdminOrdersClient
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
