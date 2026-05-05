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
import { upsertPlan } from "@/actions/admin-plans"
import {
  bulkUpdatePlanFeatures,
  getGroupedFeatures,
  getPlanFeatureMappings,
} from "@/actions/admin-features"
import { toast } from "sonner"
import { Check } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface Plan {
  id: string
  name: string
  mode: "monthly" | "yearly" | "free" | "lifetime"
  slots: number
  regularPrice: number
  finalPrice: number
  currency: string
  stripePaymentLink: string | null
  isActive: boolean
  features: any // Using any for jsonb
  position: number
  trialDays: number
  yearlyDiscountPercentage: number | null
  yearlyDiscountCouponCode: string | null
  couponCode: string | null
  hasYearlyPlan: boolean
  badge: string | null
  monthlyCancelDiscount: number
  yearlyCancelDiscount: number
  monthlyCancelCouponCode: string | null
  yearlyCancelCouponCode: string | null
  monthlyCancelDuration: number
  yearlyCancelDuration: number
  cancelApplyDiscount: boolean
}

interface PlanEditDialogProps {
  plan?: Plan | null
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
    name: plan?.name || "",
    mode: plan?.mode || "monthly",
    slots: plan?.slots || 1,
    regularPrice: plan?.regularPrice || 0,
    finalPrice: plan?.finalPrice || 0,
    currency: plan?.currency || "usd",
    stripePaymentLink: plan?.stripePaymentLink || "",
    isActive: plan?.isActive ?? true,
    featuresText: Array.isArray(plan?.features)
      ? plan?.features.join("\n")
      : "",
    position: (plan?.position || 0) as number,
    trialDays: (plan?.trialDays || 0) as number,
    yearlyDiscountPercentage: (plan?.yearlyDiscountPercentage || 0) as number,
    yearlyDiscountCouponCode: plan?.yearlyDiscountCouponCode || "",
    couponCode: plan?.couponCode || "",
    hasYearlyPlan: plan?.hasYearlyPlan ?? false,
    badge: plan?.badge || "",
    monthlyCancelDiscount: plan?.monthlyCancelDiscount || 0,
    yearlyCancelDiscount: plan?.yearlyCancelDiscount || 0,
    monthlyCancelCouponCode: plan?.monthlyCancelCouponCode || "",
    yearlyCancelCouponCode: plan?.yearlyCancelCouponCode || "",
    monthlyCancelDuration: plan?.monthlyCancelDuration || 3,
    yearlyCancelDuration: plan?.yearlyCancelDuration || 1,
    cancelApplyDiscount: plan?.cancelApplyDiscount ?? false,
  })
  const [availableFeatures, setAvailableFeatures] = useState<any[]>([])
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([])
  const [featuresLoading, setFeaturesLoading] = useState(false)

  // Load features and mappings
  React.useEffect(() => {
    async function loadFeatures() {
      setFeaturesLoading(true)
      const grouped = await getGroupedFeatures()
      setAvailableFeatures(grouped)

      if (plan?.id) {
        const mappings = await getPlanFeatureMappings(plan.id)
        setSelectedFeatureIds(
          mappings.filter((m) => m.isEnabled).map((m) => m.featureId)
        )
      } else {
        setSelectedFeatureIds([])
      }
      setFeaturesLoading(false)
    }
    if (open) {
      loadFeatures()
    }
  }, [open, plan])

  // Reset form when plan changes or dialog opens
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: plan?.name || "",
        mode: plan?.mode || "monthly",
        slots: plan?.slots || 1,
        regularPrice: plan?.regularPrice || 0,
        finalPrice: plan?.finalPrice || 0,
        currency: plan?.currency || "usd",
        stripePaymentLink: plan?.stripePaymentLink || "",
        isActive: plan?.isActive ?? true,
        featuresText: Array.isArray(plan?.features)
          ? plan?.features.join("\n")
          : "",
        position: (plan?.position || 0) as number,
        trialDays: (plan?.trialDays || 0) as number,
        yearlyDiscountPercentage: (plan?.yearlyDiscountPercentage ||
          0) as number,
        yearlyDiscountCouponCode: plan?.yearlyDiscountCouponCode || "",
        couponCode: plan?.couponCode || "",
        hasYearlyPlan: plan?.hasYearlyPlan ?? false,
        badge: plan?.badge || "",
        monthlyCancelDiscount: plan?.monthlyCancelDiscount || 0,
        yearlyCancelDiscount: plan?.yearlyCancelDiscount || 0,
        monthlyCancelCouponCode: plan?.monthlyCancelCouponCode || "",
        yearlyCancelCouponCode: plan?.yearlyCancelCouponCode || "",
        monthlyCancelDuration: plan?.monthlyCancelDuration || 3,
        yearlyCancelDuration: plan?.yearlyCancelDuration || 1,
        cancelApplyDiscount: plan?.cancelApplyDiscount ?? false,
      })
    }
  }, [open, plan])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const features = formData.featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f !== "")

    const result = await upsertPlan({
      id: plan?.id,
      name: formData.name,
      mode: formData.mode,
      slots: formData.slots,
      regularPrice: formData.regularPrice,
      finalPrice: formData.finalPrice,
      currency: formData.currency,
      stripePaymentLink: formData.stripePaymentLink || null,
      isActive: formData.isActive,
      features,
      position: formData.position,
      trialDays: formData.trialDays,
      yearlyDiscountPercentage: formData.yearlyDiscountPercentage,
      yearlyDiscountCouponCode: formData.yearlyDiscountCouponCode || null,
      couponCode: formData.couponCode || null,
      hasYearlyPlan: formData.hasYearlyPlan,
      badge: formData.badge || null,
      monthlyCancelDiscount: formData.monthlyCancelDiscount,
      yearlyCancelDiscount: formData.yearlyCancelDiscount,
      monthlyCancelCouponCode: formData.monthlyCancelCouponCode || null,
      yearlyCancelCouponCode: formData.yearlyCancelCouponCode || null,
      monthlyCancelDuration: formData.monthlyCancelDuration,
      yearlyCancelDuration: formData.yearlyCancelDuration,
      cancelApplyDiscount: formData.cancelApplyDiscount,
    })

    if (result.success && result.id) {
      // Sync dynamic features
      await bulkUpdatePlanFeatures(result.id, selectedFeatureIds)

      setLoading(false)
      toast.success(
        plan ? "Plan updated successfully" : "Plan created successfully"
      )
      onSuccess()
      onOpenChange(false)
    } else {
      setLoading(false)
      toast.error("Failed to save plan")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>
              {plan ? `Edit Plan: ${plan.name}` : "Create New Plan"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <div className="space-y-4">
              <h3 className="border-l-2 border-orange-500 pl-2 text-sm font-semibold text-slate-900">
                Basic Information
              </h3>
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
                  <Label htmlFor="mode">Plan Mode</Label>
                  <Select
                    value={formData.mode}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, mode: value })
                    }
                  >
                    <SelectTrigger id="mode">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="lifetime">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="slots">Slots</Label>
                  <Input
                    id="slots"
                    type="number"
                    value={formData.slots}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slots: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="position">Position (Order)</Label>
                  <Select
                    value={String(formData.position)}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        position: parseInt(value || "0"),
                      })
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

                <div className="grid gap-2">
                  <Label htmlFor="trialDays">Trial Days</Label>
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

                <div className="grid gap-2">
                  <Label htmlFor="couponCode">Prefill Coupon Code</Label>
                  <Input
                    id="couponCode"
                    value={formData.couponCode}
                    onChange={(e) =>
                      setFormData({ ...formData, couponCode: e.target.value })
                    }
                    placeholder="e.g. WELCOME20"
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-2 pt-8">
                    <Switch
                      id="hasYearlyPlan"
                      checked={formData.hasYearlyPlan}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, hasYearlyPlan: checked })
                      }
                    />
                    <Label htmlFor="hasYearlyPlan" className="cursor-pointer">
                      Has Yearly Plan
                    </Label>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="yearlyDiscountPercentage">
                    Yearly Discount (%)
                  </Label>
                  <Input
                    id="yearlyDiscountPercentage"
                    type="number"
                    value={formData.yearlyDiscountPercentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearlyDiscountPercentage: parseInt(
                          e.target.value || "0"
                        ),
                      })
                    }
                    placeholder="e.g. 30"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="yearlyDiscountCouponCode">
                    Yearly Discount Coupon Code
                  </Label>
                  <Input
                    id="yearlyDiscountCouponCode"
                    value={formData.yearlyDiscountCouponCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearlyDiscountCouponCode: e.target.value,
                      })
                    }
                    placeholder="e.g. SAVE30"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="badge">Badge Label</Label>
                  <Input
                    id="badge"
                    value={formData.badge}
                    onChange={(e) =>
                      setFormData({ ...formData, badge: e.target.value })
                    }
                    placeholder="e.g. Most Popular, Best Value, Hot Deal"
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
                    setFormData({
                      ...formData,
                      stripePaymentLink: e.target.value,
                    })
                  }
                  placeholder="https://buy.stripe.com/..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="features">Card Features (one per line)</Label>
                <Textarea
                  id="features"
                  value={formData.featuresText}
                  onChange={(e) =>
                    setFormData({ ...formData, featuresText: e.target.value })
                  }
                  rows={4}
                  placeholder="1 License Slot&#10;Community Support"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="border-l-2 border-orange-500 pl-2 text-sm font-semibold text-slate-900">
                Comparison Table Features (Dynamic)
              </h3>
              {featuresLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner className="h-6 w-6 text-slate-400" />
                </div>
              ) : (
                <div className="grid gap-6 rounded-xl border bg-slate-50/50 p-4">
                  {availableFeatures.map((category) => (
                    <div key={category.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          {category.name}
                        </span>
                        <Separator className="flex-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {category.features.map((feature: any) => (
                          <div
                            key={feature.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={feature.id}
                              checked={selectedFeatureIds.includes(feature.id)}
                              onCheckedChange={(checked) => {
                                setSelectedFeatureIds((prev) =>
                                  checked
                                    ? [...prev, feature.id]
                                    : prev.filter((id) => id !== feature.id)
                                )
                              }}
                            />
                            <Label
                              htmlFor={feature.id}
                              className={cn(
                                "cursor-pointer text-sm leading-none transition-colors",
                                selectedFeatureIds.includes(feature.id)
                                  ? "font-medium text-slate-900"
                                  : "text-slate-500"
                              )}
                            >
                              {feature.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="border-l-2 border-orange-500 pl-2 text-sm font-semibold text-slate-900">
                Cancellation Retention (Stay Offers)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="monthlyCancelDiscount">
                    Monthly Cancel Discount (%)
                  </Label>
                  <Input
                    id="monthlyCancelDiscount"
                    type="number"
                    value={formData.monthlyCancelDiscount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlyCancelDiscount: parseInt(e.target.value || "0"),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="yearlyCancelDiscount">
                    Yearly Cancel Discount (%)
                  </Label>
                  <Input
                    id="yearlyCancelDiscount"
                    type="number"
                    value={formData.yearlyCancelDiscount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearlyCancelDiscount: parseInt(e.target.value || "0"),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="monthlyCancelCouponCode">
                    Monthly Cancel Coupon
                  </Label>
                  <Input
                    id="monthlyCancelCouponCode"
                    value={formData.monthlyCancelCouponCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlyCancelCouponCode: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="yearlyCancelCouponCode">
                    Yearly Cancel Coupon
                  </Label>
                  <Input
                    id="yearlyCancelCouponCode"
                    value={formData.yearlyCancelCouponCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearlyCancelCouponCode: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="monthlyCancelDuration">
                    Monthly Discount Duration
                  </Label>
                  <Input
                    id="monthlyCancelDuration"
                    type="number"
                    value={formData.monthlyCancelDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlyCancelDuration: parseInt(e.target.value || "3"),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="yearlyCancelDuration">
                    Yearly Discount Duration
                  </Label>
                  <Input
                    id="yearlyCancelDuration"
                    type="number"
                    value={formData.yearlyCancelDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearlyCancelDuration: parseInt(e.target.value || "1"),
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-primary/10 bg-primary/5 p-3">
                <Switch
                  id="cancelApplyDiscount"
                  checked={formData.cancelApplyDiscount}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, cancelApplyDiscount: checked })
                  }
                />
                <Label
                  htmlFor="cancelApplyDiscount"
                  className="cursor-pointer font-medium text-primary"
                >
                  Enable Retention Discount Offer for this Plan
                </Label>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="border-l-2 border-orange-500 pl-2 text-sm font-semibold text-slate-900">
                Display & Visibility
              </h3>
              <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label
                  htmlFor="isActive"
                  className="cursor-pointer font-medium"
                >
                  Published & Visible to Users
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t bg-slate-50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-orange-600 hover:bg-orange-700"
            >
              {loading && <Spinner className="mr-2 h-4 w-4" />}
              {plan ? "Save Changes" : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
