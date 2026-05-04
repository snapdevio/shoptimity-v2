export const dynamic = "force-dynamic"

import { getMetadata } from "@/lib/metadata"
import { getAllTemplates } from "@/actions/admin-templates"
import { AdminTemplatesClient } from "./admin-templates-client"
import { Template } from "@/components/admin/template-edit-dialog"

export const metadata = getMetadata({
  title: "Admin Templates",
  description:
    "Create, edit, and manage Shopify theme templates and demo storefronts in Shoptimity.",
  pathname: "/admin/templates",
  robots: { index: false, follow: false },
})

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; limit?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const search = params.search || ""
  const limit = parseInt(params.limit || "10", 10)

  const result = await getAllTemplates(page, search, limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Templates Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and manage Shopify theme templates and demos.
        </p>
      </div>

      <AdminTemplatesClient
        data={result.data as Template[]}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        initialSearch={search}
      />
    </div>
  )
}
