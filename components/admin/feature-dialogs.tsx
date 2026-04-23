"use client"

import React, { useState, useEffect } from "react"
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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { upsertCategory, upsertFeature } from "@/actions/admin-features"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

// --- Category Dialog ---

interface Category {
  id: string
  name: string
  slug: string
  isActive: boolean
  position: number
}

interface CategoryEditDialogProps {
  category?: Category | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CategoryEditDialog({
  category,
  open,
  onOpenChange,
  onSuccess,
}: CategoryEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    isActive: true,
    position: 0,
  })

  useEffect(() => {
    if (open) {
      setFormData({
        name: category?.name || "",
        slug: category?.slug || "",
        isActive: category?.isActive ?? true,
        position: category?.position || 0,
      })
    }
  }, [open, category])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await upsertCategory({
      id: category?.id,
      ...formData,
    })
    setLoading(false)
    if (result.success) {
      toast.success(category ? "Category updated" : "Category created")
      onSuccess()
      onOpenChange(false)
    } else {
      toast.error("Failed to save category")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {category ? `Edit Category: ${category.name}` : "Create Category"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: e.target.value.toLowerCase().replace(/ /g, "-"),
                })
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cat-pos">Position</Label>
            <Input
              id="cat-pos"
              type="number"
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: parseInt(e.target.value) })
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="cat-active"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
            <Label htmlFor="cat-active">Active</Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// --- Feature Dialog ---

interface Feature {
  id: string
  categoryId: string
  name: string
  slug: string
  isActive: boolean
  position: number
  isHighlight: boolean
}

interface FeatureEditDialogProps {
  feature?: Feature | null
  categories: any[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function FeatureEditDialog({
  feature,
  categories,
  open,
  onOpenChange,
  onSuccess,
}: FeatureEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    categoryId: "",
    name: "",
    slug: "",
    isActive: true,
    position: 0,
    isHighlight: false,
  })

  useEffect(() => {
    if (open) {
      setFormData({
        categoryId: feature?.categoryId || categories[0]?.id || "",
        name: feature?.name || "",
        slug: feature?.slug || "",
        isActive: feature?.isActive ?? true,
        position: feature?.position || 0,
        isHighlight: feature?.isHighlight ?? false,
      })
    }
  }, [open, feature, categories])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await upsertFeature({
      id: feature?.id,
      ...formData,
    })
    setLoading(false)
    if (result.success) {
      toast.success(feature ? "Feature updated" : "Feature created")
      onSuccess()
      onOpenChange(false)
    } else {
      toast.error("Failed to save feature")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {feature ? `Edit Feature: ${feature.name}` : "Create Feature"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="feat-cat">Category</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(v: string | null) =>
                setFormData({ ...formData, categoryId: v || "" })
              }
            >
              <SelectTrigger id="feat-cat">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="feat-name">Name</Label>
            <Input
              id="feat-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: e.target.value.toLowerCase().replace(/ /g, "-"),
                })
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="feat-slug">Slug</Label>
            <Input
              id="feat-slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="feat-pos">Position</Label>
            <Input
              id="feat-pos"
              type="number"
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: parseInt(e.target.value) })
              }
            />
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="feat-active"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="feat-active">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="feat-highlight"
                checked={formData.isHighlight}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isHighlight: checked })
                }
              />
              <Label htmlFor="feat-highlight">
                Highlight (Conversion Focus)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Feature
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
