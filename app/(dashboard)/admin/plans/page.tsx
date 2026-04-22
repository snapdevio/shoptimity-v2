"use client"

import React, { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, ExternalLink } from "lucide-react"
import { getAllPlans } from "@/actions/admin-plans"
import { PlanEditDialog } from "@/components/admin/plan-edit-dialog"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<any | null>(null)

  const fetchPlans = async () => {
    setLoading(true)
    const data = await getAllPlans()
    setPlans(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Pricing Plans
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your pricing tiers, slots, and Stripe payment links.
          </p>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Pos</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slots</TableHead>
              <TableHead>Regular Price</TableHead>
              <TableHead>Final Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stripe Link</TableHead>
              <TableHead>Trial Day</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="w-[50px] font-mono text-[10px] text-muted-foreground">
                  #{plan.position}
                </TableCell>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>{plan.slots}</TableCell>
                <TableCell>{formatPrice(plan.regularPrice)}</TableCell>
                <TableCell>{formatPrice(plan.finalPrice)}</TableCell>
                <TableCell>
                  <Badge variant={plan.isActive ? "default" : "secondary"}>
                    {plan.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {plan.stripePaymentLink ? (
                    <a
                      href={plan.stripePaymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      View <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </TableCell>
                <TableCell>{plan.trialDays}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingPlan(plan)}
                  >
                    <Edit2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingPlan && (
        <PlanEditDialog
          plan={editingPlan}
          open={!!editingPlan}
          onOpenChange={(open) => !open && setEditingPlan(null)}
          onSuccess={fetchPlans}
        />
      )}
    </div>
  )
}
