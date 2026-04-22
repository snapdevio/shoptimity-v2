"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updatePlan } from "@/actions/admin-plans"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface Plan {
  id: string
  name: string
  slots: number
  regularPrice: number
  finalPrice: number
  currency: string
  stripePaymentLink: string | null
  isActive: boolean
  features: any // Using any for jsonb
  position: number
  trialDays: number
}

interface PlanEditDialogProps {
  plan: Plan
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PlanEditDialog({
  plan,
  open,
  onOpenChange,
  onSuccess,
}: PlanEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: plan.name,
    slots: plan.slots,
    regularPrice: plan.regularPrice,
    finalPrice: plan.finalPrice,
    currency: plan.currency,
    stripePaymentLink: plan.stripePaymentLink || "",
    isActive: plan.isActive,
    featuresText: Array.isArray(plan.features) ? plan.features.join("\n") : "",
    position: (plan.position || 0) as number,
    trialDays: (plan.trialDays || 0) as number,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const features = formData.featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f !== "")

    const result = await updatePlan({
      id: plan.id,
      name: formData.name,
      slots: formData.slots,
      regularPrice: formData.regularPrice,
      finalPrice: formData.finalPrice,
      currency: formData.currency,
      stripePaymentLink: formData.stripePaymentLink || null,
      isActive: formData.isActive,
      features,
      position: formData.position,
      trialDays: formData.trialDays,
    })

    setLoading(false)

    if (result.success) {
      toast.success("Plan updated successfully")
      onSuccess()
      onOpenChange(false)
    } else {
      toast.error(
        typeof result.error === "string"
          ? result.error
          : "Failed to update plan"
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Plan: {plan.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="position">Position (Order)</Label>
              <Select
                value={String(formData.position) as string}
                onValueChange={(value) =>
                  setFormData({ ...formData, position: parseInt(value || "0") })
                }
              >
                <SelectTrigger id="position">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(21)].map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="slots">Slots</Label>
              <Input
                id="slots"
                type="number"
                value={formData.slots}
                onChange={(e) =>
                  setFormData({ ...formData, slots: parseInt(e.target.value) })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="regularPrice">Regular Price (cents)</Label>
              <Input
                id="regularPrice"
                type="number"
                value={formData.regularPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    regularPrice: parseInt(e.target.value),
                  })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="finalPrice">Final Price (cents)</Label>
              <Input
                id="finalPrice"
                type="number"
                value={formData.finalPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    finalPrice: parseInt(e.target.value),
                  })
                }
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="trialDays">Trial Days (0 for none)</Label>
              <Input
                id="trialDays"
                type="number"
                value={formData.trialDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trialDays: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stripePaymentLink">Stripe Payment Link</Label>
            <Input
              id="stripePaymentLink"
              type="url"
              value={formData.stripePaymentLink}
              onChange={(e) =>
                setFormData({ ...formData, stripePaymentLink: e.target.value })
              }
              placeholder="https://buy.stripe.com/..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="features">Features (one per line)</Label>
            <Textarea
              id="features"
              value={formData.featuresText}
              onChange={(e) =>
                setFormData({ ...formData, featuresText: e.target.value })
              }
              rows={5}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
