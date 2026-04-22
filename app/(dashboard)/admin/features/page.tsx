"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react"
import {
  getAllFeatures,
  deleteFeature,
  getAllCategories,
  updatePlanFeature,
  getPlanFeatures,
} from "@/actions/admin-features"
import { getAllPlans } from "@/actions/admin-plans"
import { FeatureEditDialog } from "@/components/admin/feature-dialogs"
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
import { Checkbox } from "@/components/ui/checkbox"

export default function AdminFeaturesPage() {
  const [data, setData] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [planFeaturesMap, setPlanFeaturesMap] = useState<any[]>([])
  const [metadata, setMetadata] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [editingFeature, setEditingFeature] = useState<any | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    search: "",
    sortField: "position",
    sortOrder: "asc" as "asc" | "desc",
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [featRes, catRes, planRes, mapRes] = await Promise.all([
      getAllFeatures(params),
      getAllCategories({ limit: 100 }),
      getAllPlans({ limit: 10 }),
      getPlanFeatures(),
    ])
    setData(featRes.data)
    setMetadata(featRes.metadata)
    setCategories(catRes.data)
    setPlans(planRes.data)
    setPlanFeaturesMap(mapRes)
    setLoading(false)
  }, [params])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async () => {
    if (!itemToDelete) return
    const result = await deleteFeature(itemToDelete)
    if (result.success) {
      toast.success("Feature deleted")
      fetchData()
    } else {
      toast.error("Failed to delete feature")
    }
    setItemToDelete(null)
  }

  const handleTogglePlanFeature = async (
    planId: string,
    featureId: string,
    current: boolean
  ) => {
    const result = await updatePlanFeature(planId, featureId, !current)
    if (result.success) {
      toast.success("Plan mapping updated")
      const newMaps = await getPlanFeatures()
      setPlanFeaturesMap(newMaps)
    } else {
      toast.error("Failed to update mapping")
    }
  }

  const isEnabled = (planId: string, featureId: string) => {
    return planFeaturesMap.some(
      (m) => m.planId === planId && m.featureId === featureId && m.isEnabled
    )
  }

  const columns: DataTableColumn<any>[] = [
    { key: "position", header: "Pos", sortable: true, className: "w-[60px]" },
    {
      key: "name",
      header: "Feature Name",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold">{row.name}</span>
          <span className="text-[10px] tracking-tighter text-slate-400 uppercase">
            {row.categoryName}
          </span>
        </div>
      ),
    },
    {
      key: "isHighlight",
      header: "Highlight",
      sortable: true,
      render: (row) =>
        row.isHighlight ? (
          <Badge className="border-none bg-orange-100 text-orange-600 hover:bg-orange-100">
            Focus
          </Badge>
        ) : (
          "-"
        ),
    },
    ...plans.map((plan) => ({
      key: `plan_${plan.id}`,
      header: plan.name,
      className: "text-center",
      render: (row: any) => (
        <div className="flex justify-center">
          <Checkbox
            checked={isEnabled(plan.id, row.id)}
            onCheckedChange={() =>
              handleTogglePlanFeature(
                plan.id,
                row.id,
                isEnabled(plan.id, row.id)
              )
            }
          />
        </div>
      ),
    })),
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
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">
            Features & Mappings
          </h1>
          <p className="mt-1 text-slate-500">
            Configure features and enable them for specific plans.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="size-4" /> Create Feature
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
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingFeature(row)}
            >
              <Edit2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
              onClick={() => setItemToDelete(row.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      />

      <FeatureEditDialog
        feature={editingFeature}
        categories={categories}
        open={!!editingFeature}
        onOpenChange={(open) => !open && setEditingFeature(null)}
        onSuccess={fetchData}
      />

      <FeatureEditDialog
        categories={categories}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={fetchData}
      />

      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={(o) => !o && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this feature and its plan
              associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete Feature
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
