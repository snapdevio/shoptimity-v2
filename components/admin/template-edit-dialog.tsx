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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createTemplate,
  updateTemplate,
  uploadTemplateImage,
  uploadTemplateZip,
} from "@/actions/admin-templates"
import { Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export interface Template {
  id: string
  title: string
  description: string | null
  img: string | null
  bg: string | null
  downloadLink: string | null
  previewLink: string | null
  logo: string | null
  banner: string | null
  startSize: string | null
  shortDesc: string | null
  cro: string | null
  aov: string | null
  rev: string | null
  status: "active" | "inactive"
  position: number
  createdAt: string | Date
  updatedAt: string | Date
}

interface TemplateEditDialogProps {
  template?: Template | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TemplateEditDialog({
  template,
  open,
  onOpenChange,
  onSuccess,
}: TemplateEditDialogProps) {
  const [status, setStatus] = useState({
    loading: false,
    progress: null as string | null,
  })

  const [files, setFiles] = useState<{
    img: File | null
    zip: File | null
    logo: File | null
    banner: File | null
  }>({
    img: null,
    zip: null,
    logo: null,
    banner: null,
  })

  const [errors, setErrors] = useState<{
    img: string | null
    zip: string | null
    logo: string | null
    banner: string | null
    submit: string | null
  }>({
    img: null,
    zip: null,
    logo: null,
    banner: null,
    submit: null,
  })
  const isEditing = !!template

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    img: "",
    bg: "bg-[#F4F9F4]",
    downloadLink: "",
    previewLink: "",
    logo: "",
    banner: "",
    startSize: "",
    shortDesc: "",
    cro: "",
    aov: "",
    rev: "",
    status: "active" as "active" | "inactive",
    position: 0 as number,
  })

  function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErrors((prev) => ({ ...prev, img: null }))

    // 5MB limit for images
    if (file.size > 5 * 1024 * 1024) {
      const msg = `Image "${file.name}" is too large (${formatBytes(file.size)}). Max 5MB allowed.`
      setErrors((prev) => ({ ...prev, img: msg }))
      e.target.value = ""
      return
    }

    setFiles((prev) => ({ ...prev, img: file }))
    // Create a temporary preview URL
    const previewUrl = URL.createObjectURL(file)
    setFormData((prev) => ({ ...prev, img: previewUrl }))
  }

  function handleZipSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErrors((prev) => ({ ...prev, zip: null }))

    if (!file.name.endsWith(".zip")) {
      const msg = `"${file.name}" is not a .zip file`
      setErrors((prev) => ({ ...prev, zip: msg }))
      e.target.value = ""
      return
    }

    // 10MB limit for ZIP files
    if (file.size > 10 * 1024 * 1024) {
      const msg = `ZIP file "${file.name}" is too large (${formatBytes(file.size)}). Max 10MB allowed.`
      setErrors((prev) => ({ ...prev, zip: msg }))
      e.target.value = ""
      return
    }

    setFiles((prev) => ({ ...prev, zip: file }))
  }

  function clearImgSelection() {
    setFiles((prev) => ({ ...prev, img: null }))
    setErrors((prev) => ({ ...prev, img: null }))
    setFormData((prev) => ({ ...prev, img: template?.img || "" }))
  }

  function clearZipSelection() {
    setFiles((prev) => ({ ...prev, zip: null }))
    setErrors((prev) => ({ ...prev, zip: null }))
    setFormData((prev) => ({
      ...prev,
      downloadLink: template?.downloadLink || "",
    }))
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErrors((prev) => ({ ...prev, logo: null }))
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, logo: "Logo too large. Max 2MB." }))
      return
    }
    setFiles((prev) => ({ ...prev, logo: file }))
    const previewUrl = URL.createObjectURL(file)
    setFormData((prev) => ({ ...prev, logo: previewUrl }))
  }

  function handleBannerSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErrors((prev) => ({ ...prev, banner: null }))
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, banner: "Banner too large. Max 5MB." }))
      return
    }
    setFiles((prev) => ({ ...prev, banner: file }))
    const previewUrl = URL.createObjectURL(file)
    setFormData((prev) => ({ ...prev, banner: previewUrl }))
  }

  useEffect(() => {
    if (open) {
      setFormData({
        title: template?.title || "",
        description: template?.description || "",
        img: template?.img || "",
        bg: template?.bg || "bg-[#F4F9F4]",
        downloadLink: template?.downloadLink || "",
        previewLink: template?.previewLink || "",
        logo: template?.logo || "",
        banner: template?.banner || "",
        startSize: template?.startSize || "",
        shortDesc: template?.shortDesc || "",
        cro: template?.cro || "",
        aov: template?.aov || "",
        rev: template?.rev || "",
        status: (template?.status as "active" | "inactive") || "active",
        position: template?.position || 0,
      })
      setFiles({
        img: null,
        zip: null,
        logo: null,
        banner: null,
      })
      setErrors({
        img: null,
        zip: null,
        logo: null,
        banner: null,
        submit: null,
      })
      setStatus({ loading: false, progress: null })
    }
  }, [open, template])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus({ loading: true, progress: "Preparing..." })
    setErrors((prev) => ({ ...prev, submit: null }))

    try {
      let currentImgUrl = formData.img
      let currentZipUrl = formData.downloadLink
      let currentLogoUrl = formData.logo
      let currentBannerUrl = formData.banner

      // 1. Upload Image (Server Action)
      if (files.img) {
        setStatus((prev) => ({ ...prev, progress: "Uploading Image..." }))
        const imgFormData = new FormData()
        imgFormData.set("file", files.img)

        const uploadResult = await uploadTemplateImage(imgFormData)
        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(
            (uploadResult.error as string) || "Failed to upload image"
          )
        }
        currentImgUrl = uploadResult.url
      }

      // 2. Upload ZIP (Server Action)
      if (files.zip) {
        setStatus((prev) => ({ ...prev, progress: "Uploading ZIP..." }))
        const zipFormData = new FormData()
        zipFormData.set("file", files.zip)

        const uploadResult = await uploadTemplateZip(zipFormData)
        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(
            (uploadResult.error as string) || "Failed to upload ZIP"
          )
        }
        currentZipUrl = uploadResult.url
      }

      // 3. Upload Logo
      if (files.logo) {
        setStatus((prev) => ({ ...prev, progress: "Uploading Logo..." }))
        const logoFormData = new FormData()
        logoFormData.set("file", files.logo)
        const uploadResult = await uploadTemplateImage(logoFormData)
        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(
            (uploadResult.error as string) || "Failed to upload logo"
          )
        }
        currentLogoUrl = uploadResult.url
      }

      // 4. Upload Banner
      if (files.banner) {
        setStatus((prev) => ({ ...prev, progress: "Uploading Banner..." }))
        const bannerFormData = new FormData()
        bannerFormData.set("file", files.banner)
        const uploadResult = await uploadTemplateImage(bannerFormData)
        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(
            (uploadResult.error as string) || "Failed to upload banner"
          )
        }
        currentBannerUrl = uploadResult.url
      }

      setStatus((prev) => ({ ...prev, progress: "Saving template data..." }))
      const payload = {
        ...formData,
        img: currentImgUrl,
        downloadLink: currentZipUrl,
        logo: currentLogoUrl,
        banner: currentBannerUrl,
        id: template?.id,
      }

      const result = isEditing
        ? await updateTemplate(payload)
        : await createTemplate(payload)

      if (result.success) {
        onSuccess()
        onOpenChange(false)
      } else {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Failed to save template. Please check the fields."
        )
      }
    } catch (error: any) {
      console.error("Submit error:", error)
      const errorMessage = error.message || "An unexpected error occurred"
      setErrors((prev) => ({ ...prev, submit: errorMessage }))
    } finally {
      setStatus({ loading: false, progress: null })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? (
              <>
                Edit Template:{" "}
                <span className="mr-1 rounded bg-primary/10 px-1 text-primary">
                  {template.title}
                </span>
              </>
            ) : (
              "Create New Template"
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label
                htmlFor="title"
                className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
              >
                Template Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                placeholder="e.g. Fashion Store"
                className="h-9"
              />
            </div>
            {/* Background Style moved here for better balance */}
            <div className="grid gap-1.5">
              <Label
                htmlFor="bg"
                className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
              >
                Background Style
              </Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="size-9 cursor-pointer overflow-hidden rounded-md border p-0"
                  value={(() => {
                    const match = formData.bg.match(/\[#([0-9a-fA-F]{6})\]/)
                    return match ? `#${match[1]}` : "#ffffff"
                  })()}
                  onChange={(e) => {
                    const newColor = e.target.value.toUpperCase()
                    setFormData({ ...formData, bg: `bg-[${newColor}]` })
                  }}
                  title="Pick a background color"
                />
                <Input
                  id="bg"
                  value={formData.bg}
                  onChange={(e) =>
                    setFormData({ ...formData, bg: e.target.value })
                  }
                  placeholder="bg-[#F4F9F4]"
                  className="flex-1 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label
              htmlFor="description"
              className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
            >
              Main Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detailed description of the template features..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <Label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Template Main Image
            </Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted-foreground italic">
                      (Max 5MB)
                    </span>
                    {files.img && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={clearImgSelection}
                        className="h-auto p-0 text-[10px] text-destructive hover:no-underline"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={status.loading}
                    className="h-8 cursor-pointer text-[10px]"
                  />
                  {errors.img && (
                    <p className="text-[10px] text-destructive">{errors.img}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="img"
                    className="text-[10px] font-bold text-muted-foreground uppercase"
                  >
                    Path / URL
                  </Label>
                  <Input
                    id="img"
                    value={formData.img}
                    onChange={(e) =>
                      setFormData({ ...formData, img: e.target.value })
                    }
                    placeholder="/assets/zenvyra-web.webp"
                    className="h-8 text-[10px]"
                  />
                </div>
              </div>

              <div className="relative aspect-video overflow-hidden rounded-md border bg-muted shadow-sm">
                <img
                  src={formData.img || undefined}
                  alt="Main Preview"
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      "https://placehold.co/400x225?text=Preview+Not+Available"
                  }}
                />
                <div className="absolute top-1 right-1 flex gap-1">
                  {files.img && (
                    <Badge variant="default" className="h-4 px-1 text-[8px]">
                      New
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="h-4 bg-white/80 px-1 text-[8px] backdrop-blur-sm"
                  >
                    Preview
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center justify-between border-b border-foreground/5 pb-2">
              <Label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Theme Assets & Demo
              </Label>
              <Badge
                variant="outline"
                className="text-[10px] font-normal uppercase opacity-70"
              >
                ZIP / Live Link
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="zip-upload"
                      className="text-[10px] font-bold text-muted-foreground uppercase"
                    >
                      Upload ZIP
                    </Label>
                    {files.zip && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={clearZipSelection}
                        className="h-auto p-0 text-[10px] text-destructive"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Input
                    id="zip-upload"
                    type="file"
                    accept=".zip"
                    onChange={handleZipSelect}
                    disabled={status.loading}
                    className="h-8 cursor-pointer text-[10px]"
                  />
                  <Input
                    id="downloadLink"
                    value={formData.downloadLink}
                    onChange={(e) =>
                      setFormData({ ...formData, downloadLink: e.target.value })
                    }
                    placeholder="Custom ZIP URL"
                    className="h-8 font-mono text-[10px]"
                  />
                  {errors.zip && (
                    <p className="text-[10px] text-destructive">{errors.zip}</p>
                  )}
                </div>

                {files.zip && (
                  <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-[10px]">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-primary">
                        {files.zip.name}
                      </p>
                      <p className="opacity-70">
                        {formatBytes(files.zip.size)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-end gap-3">
                <div className="space-y-1.5 md:pb-10">
                  <Label
                    htmlFor="previewLink"
                    className="text-[10px] font-bold text-muted-foreground uppercase"
                  >
                    Live Preview Link
                  </Label>
                  <Input
                    id="previewLink"
                    value={formData.previewLink}
                    onChange={(e) =>
                      setFormData({ ...formData, previewLink: e.target.value })
                    }
                    placeholder="https://preview-store.myshopify.com"
                    className="h-8 text-[10px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
              <Label
                htmlFor="logo"
                className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
              >
                Brand Logo
              </Label>
              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="h-8 cursor-pointer text-[10px]"
                  />
                  {errors.logo && (
                    <p className="text-[10px] text-destructive">
                      {errors.logo}
                    </p>
                  )}
                  <Input
                    id="logo"
                    value={formData.logo || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, logo: e.target.value })
                    }
                    placeholder="Logo URL"
                    className="h-8 text-[10px]"
                  />
                </div>
                {formData.logo && (
                  <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md border bg-white p-2">
                    <img
                      src={formData.logo}
                      alt="Brand Logo"
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src =
                          "https://placehold.co/200x100?text=Logo+Preview"
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
              <Label
                htmlFor="banner"
                className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
              >
                Template Banner
              </Label>
              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <Input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleBannerSelect}
                    className="h-8 cursor-pointer text-[10px]"
                  />
                  {errors.banner && (
                    <p className="text-[10px] text-destructive">
                      {errors.banner}
                    </p>
                  )}
                  <Input
                    id="banner"
                    value={formData.banner || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, banner: e.target.value })
                    }
                    placeholder="Banner URL"
                    className="h-8 text-[10px]"
                  />
                </div>
                {formData.banner && (
                  <div className="relative aspect-video overflow-hidden rounded-md border bg-muted">
                    <img
                      src={formData.banner}
                      alt="Template Banner"
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src =
                          "https://placehold.co/400x225?text=Banner+Preview"
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <Label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Performance Metrics & Info
            </Label>
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label
                  htmlFor="shortDesc"
                  className="text-[10px] font-bold text-muted-foreground uppercase"
                >
                  Short Description (Punchline)
                </Label>
                <Input
                  id="shortDesc"
                  value={formData.shortDesc || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, shortDesc: e.target.value })
                  }
                  placeholder="e.g. High-conversion street fashion layout"
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="grid gap-1.5">
                  <Label
                    htmlFor="startSize"
                    className="text-center text-[10px] font-bold text-muted-foreground uppercase"
                  >
                    Star size
                  </Label>
                  <Input
                    id="startSize"
                    value={formData.startSize || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, startSize: e.target.value })
                    }
                    placeholder="5"
                    className="h-9 text-center"
                    type="number"
                    min={0}
                    max={5}
                    step="0.1"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label
                    htmlFor="cro"
                    className="text-center text-[10px] font-bold text-muted-foreground uppercase"
                  >
                    CRO
                  </Label>
                  <Input
                    id="cro"
                    value={formData.cro || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, cro: e.target.value })
                    }
                    placeholder="+24%"
                    className="h-9 text-center"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label
                    htmlFor="aov"
                    className="text-center text-[10px] font-bold text-muted-foreground uppercase"
                  >
                    AOV
                  </Label>
                  <Input
                    id="aov"
                    value={formData.aov || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, aov: e.target.value })
                    }
                    placeholder="+10%"
                    className="h-9 text-center"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label
                    htmlFor="rev"
                    className="text-center text-[10px] font-bold text-muted-foreground uppercase"
                  >
                    Revenue
                  </Label>
                  <Input
                    id="rev"
                    value={formData.rev || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, rev: e.target.value })
                    }
                    placeholder="+80%"
                    className="h-9 text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="col-span-2 flex items-center space-x-2 rounded-md border bg-muted/30 p-3">
              <Switch
                id="status"
                checked={formData.status === "active"}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    status: checked ? "active" : "inactive",
                  })
                }
              />
              <div className="grid gap-0.5 leading-none">
                <Label htmlFor="status" className="text-sm font-semibold">
                  Active Status
                </Label>
                <p className="text-[10px] text-muted-foreground italic">
                  {formData.status === "active"
                    ? "This template is visible in the store"
                    : "This template is hidden from users"}
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="position">Display Order</Label>
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
                  {[...Array(101)].map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col pt-4 sm:flex-col sm:justify-end sm:space-x-0">
            {status.progress && (
              <div className="mb-3 flex w-full animate-pulse items-center justify-end gap-2 text-[10px] font-bold text-primary">
                <Loader2 className="h-3 w-3 animate-spin" />
                {status.progress}
              </div>
            )}
            {errors.submit && (
              <div className="mb-3 rounded-md bg-destructive/10 p-2 text-center text-[11px] font-medium text-destructive">
                {errors.submit}
              </div>
            )}
            <div className="flex w-full justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={status.loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={status.loading}
                className="min-w-32"
              >
                {status.loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Save Changes" : "Create Template"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
