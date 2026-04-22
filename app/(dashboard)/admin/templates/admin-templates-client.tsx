"use client"

import React, { useState, useTransition } from "react"
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
import {
  Edit2,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  Search,
} from "lucide-react"
import { deleteTemplate } from "@/actions/admin-templates"
import {
  TemplateEditDialog,
  Template,
} from "@/components/admin/template-edit-dialog"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
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
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

interface AdminTemplatesClientProps {
  data: Template[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  initialSearch: string
}

export function AdminTemplatesClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  initialSearch,
}: AdminTemplatesClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [localSearch, setLocalSearch] = useState(initialSearch)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSearchChange(value: string) {
    setLocalSearch(value)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (value) params.set("search", value)
      if (pageSize !== 10) params.set("limit", String(pageSize))
      params.set("page", "1")
      router.push(`/admin/templates?${params.toString()}`)
    }, 300)
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams()
    if (initialSearch) params.set("search", initialSearch)
    if (pageSize !== 10) params.set("limit", String(pageSize))
    params.set("page", String(newPage))
    router.push(`/admin/templates?${params.toString()}`)
  }

  async function handleDelete() {
    if (!deletingId) return
    startTransition(async () => {
      const result = await deleteTemplate(deletingId)
      if (result.success) {
        toast.success("Template deleted successfully")
        router.refresh()
      } else {
        toast.error("Failed to delete template")
      }
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Template
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 text-xs hover:bg-muted/30">
              <TableHead className="w-[50px]">Pos</TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead className="min-w-[180px]">Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Style</TableHead>
              <TableHead>Links</TableHead>
              <TableHead className="hidden text-[10px] font-bold tracking-wider uppercase lg:table-cell">
                Updated
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <p>No templates found.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreateOpen(true)}
                    >
                      Create your first template
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((template) => (
                <TableRow
                  key={template.id}
                  className="group transition-colors hover:bg-muted/5"
                >
                  <TableCell className="w-[50px] font-mono text-[10px] text-muted-foreground">
                    #{template.position}
                  </TableCell>
                  <TableCell>
                    {template.img ? (
                      <div className="relative size-12 overflow-hidden rounded-md border bg-muted shadow-sm transition-transform group-hover:scale-105">
                        <img
                          src={template.img}
                          alt={template.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                        <span className="text-[10px]">No Img</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm leading-none font-medium">
                        {template.title}
                      </span>
                      {template.description && (
                        <span className="line-clamp-1 max-w-[200px] text-xs text-muted-foreground">
                          {template.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        template.status === "active" ? "default" : "secondary"
                      }
                      className="h-5 py-0 text-[10px] capitalize"
                    >
                      {template.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div
                        className={`size-4 rounded-full border shadow-sm ${template.bg || ""}`}
                        title={template.bg || ""}
                      />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {template.bg}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {template.previewLink && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          asChild
                          className="size-7 hover:text-blue-600"
                          title="Preview"
                        >
                          <a
                            href={template.previewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        </Button>
                      )}
                      {template.downloadLink && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          asChild
                          className="size-7 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                          title="Download"
                        >
                          <a
                            href={template.downloadLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="size-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-[10px] text-muted-foreground lg:table-cell">
                    {formatDistanceToNow(new Date(template.updatedAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="size-8 group-hover:bg-muted"
                        onClick={() => setEditingTemplate(template)}
                        title="Edit"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="size-8 text-destructive group-hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeletingId(template.id)}
                        disabled={isPending}
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">{data.length}</span>{" "}
            of <span className="font-medium text-foreground">{total}</span>{" "}
            templates
          </p>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{page}</span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{totalPages}</span>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="h-8"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="h-8"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <TemplateEditDialog
        template={editingTemplate}
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
        onSuccess={() => router.refresh()}
      />

      <TemplateEditDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => router.refresh()}
      />

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              template "{data.find((t) => t.id === deletingId)?.title}" and
              remove it from the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete Template"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
