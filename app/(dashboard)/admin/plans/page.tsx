"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, ExternalLink, Plus, Trash2 } from "lucide-react"
import { getAllPlans, deletePlan } from "@/actions/admin-plans"
import { PlanEditDialog } from "@/components/admin/plan-edit-dialog"
import { DataTable, DataTableColumn } from "@/components/admin/data-table"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AdminPlansPage() {
  const [data, setData] = useState<any[]>([])
  const [metadata, setMetadata] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<any | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<string | null>(null)

  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    search: "",
    sortField: "position",
    sortOrder: "asc" as "asc" | "desc",
  })

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    const result = await getAllPlans(params)
    setData(result.data)
    setMetadata(result.metadata)
    setLoading(false)
  }, [params])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const handleDelete = async () => {
    if (!planToDelete) return
    const result = await deletePlan(planToDelete)
    if (result.success) {
      toast.success("Plan deleted")
      fetchPlans()
    } else {
      toast.error("Failed to delete plan")
    }
    setPlanToDelete(null)
  }

  const columns: DataTableColumn<any>[] = [
    {
      key: "position",
      header: "Pos",
      sortable: true,
      className: "w-[80px] font-mono text-xs",
    },
    { key: "name", header: "Name", sortable: true, className: "font-bold" },
    {
      key: "mode",
      header: "Mode",
      sortable: true,
      render: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.mode}
        </Badge>
      ),
    },
    { key: "slots", header: "Slots", sortable: true },
    {
      key: "finalPrice",
      header: "Price",
      sortable: true,
      render: (row) => <span>${(row.finalPrice / 100).toFixed(2)}</span>,
    },
    {
      key: "trialDays",
      header: "Trial Days",
      sortable: true,
      render: (row) => <span>{row.trialDays}</span>,
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      render: (row) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "stripePaymentLink",
      header: "Stripe",
      render: (row) =>
        row.stripePaymentLink ? (
          <a
            href={row.stripePaymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center gap-1 text-primary hover:underline"
          >
            Link <ExternalLink className="size-3" />
          </a>
        ) : (
          "-"
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">
            Pricing Plans
          </h1>
          <p className="mt-1 text-slate-500">
            Manage your pricing tiers and feature bullet points.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="size-4" /> Create Plan
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={metadata.total}
        page={metadata.page}
        pageSize={metadata.limit}
        totalPages={metadata.totalPages}
        searchValue={params.search}
        sortField={params.sortField}
        sortOrder={params.sortOrder}
        onSearchChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))}
        onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
        onSortChange={(f, o) =>
          setParams((p) => ({ ...p, sortField: f, sortOrder: o }))
        }
        loading={loading}
        skeletonRows={5}
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingPlan(row)}
            >
              <Edit2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
              onClick={() => setPlanToDelete(row.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      />

      <PlanEditDialog
        plan={editingPlan}
        open={!!editingPlan}
        onOpenChange={(open) => !open && setEditingPlan(null)}
        onSuccess={fetchPlans}
      />

      <PlanEditDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={fetchPlans}
      />

      <AlertDialog
        open={!!planToDelete}
        onOpenChange={(o) => !o && setPlanToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the plan. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
