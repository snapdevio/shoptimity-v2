"use client"

import * as React from "react"
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages: (number | "...")[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  if (start > 2) pages.push("...")
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < totalPages - 1) pages.push("...")
  pages.push(totalPages)
  return pages
}

export interface DataTableColumn<T> {
  key: string
  header: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  searchValue: string
  searchPlaceholder?: string
  sortField?: string
  sortOrder?: "asc" | "desc"
  onSearchChange: (value: string) => void
  onPageChange: (page: number) => void
  onSortChange?: (field: string, order: "asc" | "desc") => void
  actions?: (row: T) => React.ReactNode
  emptyMessage?: string
  loading?: boolean
  skeletonRows?: number
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  total,
  page,
  pageSize,
  totalPages,
  searchValue,
  searchPlaceholder = "Search...",
  sortField,
  sortOrder,
  onSearchChange,
  onPageChange,
  onSortChange,
  actions,
  emptyMessage = "No results found.",
  loading = false,
  skeletonRows = 5,
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = React.useState(searchValue)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    setLocalSearch(searchValue)
  }, [searchValue])

  function handleSearchChange(value: string) {
    setLocalSearch(value)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      onSearchChange(value)
    }, 300)
  }

  function handleSort(column: DataTableColumn<T>) {
    if (!column.sortable || !onSortChange) return
    const isCurrentField = sortField === column.key
    const newOrder = isCurrentField && sortOrder === "asc" ? "desc" : "asc"
    onSortChange(column.key, newOrder)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <p className="ml-auto text-sm text-muted-foreground">
          {total} {total === 1 ? "result" : "results"}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "font-bold text-slate-600",
                    col.sortable &&
                      "cursor-pointer select-none hover:text-slate-900",
                    col.className
                  )}
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable && (
                      <ArrowUpDown
                        className={cn(
                          "size-3.5",
                          sortField === col.key
                            ? "text-primary"
                            : "text-slate-400"
                        )}
                      />
                    )}
                  </div>
                </TableHead>
              ))}
              {actions && (
                <TableHead className="pr-6 text-right font-bold text-slate-600">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, idx) => (
                <TableRow key={`loading-${idx}`} className="animate-pulse">
                  {columns.map((col) => (
                    <TableCell
                      key={`${col.key}-${idx}`}
                      className={cn("py-4", col.className)}
                    >
                      <Skeleton className="h-4 w-full rounded-md" />
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="pr-6 text-right">
                      <Skeleton className="h-4 w-full rounded-md" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="h-32 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow
                  key={(row.id as string) ?? i}
                  className="transition-colors hover:bg-slate-50/50"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn("py-4", col.className)}
                    >
                      {col.render
                        ? col.render(row)
                        : ((row[col.key] as React.ReactNode) ?? "-")}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="pr-6 text-right">
                      {actions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm font-medium text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-900">
              {Math.min(total, (page - 1) * pageSize + 1)}
            </span>{" "}
            to{" "}
            <span className="font-bold text-slate-900">
              {Math.min(total, page * pageSize)}
            </span>{" "}
            of <span className="font-bold text-slate-900">{total}</span> entries
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              {getPageNumbers(page, totalPages).map((p, idx) =>
                p === "..." ? (
                  <span
                    key={`gap-${idx}`}
                    className="px-2 text-sm text-slate-500"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={page === p ? "default" : "outline"}
                    size="icon"
                    className="size-8"
                    onClick={() => onPageChange(p)}
                  >
                    {p}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
