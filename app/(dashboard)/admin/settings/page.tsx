"use client"

import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { getSettings, updateSettings } from "@/actions/admin-settings"

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Record<string, any>>({})

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const data = await getSettings()
      setSettings(data || {})
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await updateSettings(settings)
      if (res.success) {
        toast.success("Settings updated successfully")
      } else {
        toast.error(res.error)
      }
    } finally {
      setSaving(false)
    }
  }

  function updateValue(key: string, value: any) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function addField() {
    const key = prompt("Enter field name (e.g., promo_code)")
    if (key && !settings[key]) {
      updateValue(key, "")
    }
  }

  function removeField(key: string) {
    if (confirm(`Are you sure you want to remove "${key}"?`)) {
      const newSettings = { ...settings }
      delete newSettings[key]
      setSettings(newSettings)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Manage global application configurations and flags.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Discounts & Promotions</CardTitle>
            <CardDescription>
              Manage active coupons and site-wide discount flags.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Enable Site-wide Discount</Label>
                <CardDescription>
                  Toggle visibility of discount badges across the site.
                </CardDescription>
              </div>
              <Switch
                checked={!!settings.enable_discount}
                onCheckedChange={(checked) =>
                  updateValue("enable_discount", checked)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Coupon Code</Label>
              <Input
                value={settings.coupon_code || ""}
                onChange={(e) => updateValue("coupon_code", e.target.value)}
                placeholder="e.g. WELCOME10"
              />
            </div>
            <div className="space-y-2">
              <Label>Discount Percentage (%)</Label>
              <Input
                type="number"
                value={settings.discount_percent || ""}
                onChange={(e) =>
                  updateValue("discount_percent", parseInt(e.target.value) || 0)
                }
                placeholder="e.g. 10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cancellation Retention</CardTitle>
            <CardDescription>
              Offer discounts when users try to cancel their subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-amber-50 p-3 text-xs text-amber-700">
              Note: Cancellation discounts and durations are now managed
              individually in the <strong>Plans</strong> section.
            </div>
            <div className="space-y-2">
              <Label>Offer Expiration Timeout (Seconds)</Label>
              <Input
                type="number"
                value={settings.cancel_offer_timeout ?? ""}
                onChange={(e) =>
                  updateValue(
                    "cancel_offer_timeout",
                    parseInt(e.target.value) || 0
                  )
                }
                placeholder="e.g. 300"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Custom Config Flags</CardTitle>
              <CardDescription>
                Add dynamic key-value pairs for other features.
              </CardDescription>
            </div>
            <Button size="icon" variant="outline" onClick={addField}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(settings).map(([key, value]) => {
              if (
                [
                  "coupon_code",
                  "discount_percent",
                  "enable_discount",
                  "cancel_offer_timeout",
                ].includes(key)
              )
                return null
              return (
                <div key={key} className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label className="capitalize">
                      {key.replace(/_/g, " ")}
                    </Label>
                    <Input
                      value={value}
                      onChange={(e) => updateValue(key, e.target.value)}
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeField(key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
            {Object.keys(settings).filter(
              (key) =>
                ![
                  "coupon_code",
                  "discount_percent",
                  "enable_discount",
                  "cancel_offer_timeout",
                ].includes(key)
            ).length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No custom flags added yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
