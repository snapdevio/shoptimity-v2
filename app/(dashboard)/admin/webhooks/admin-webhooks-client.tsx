"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronRight, Search } from "lucide-react"
import { formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface WebhookEvent {
  id: string
  eventId: string
  type: string
  customerEmail: string | null
  processed: boolean
  processingError: string | null
  processedAt: Date | null
  createdAt: Date
}

interface AdminWebhooksClientProps {
  data: WebhookEvent[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  initialSearch: string
}

export function AdminWebhooksClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  initialSearch,
}: AdminWebhooksClientProps) {
  const router = useRouter()
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())
  const [localSearch, setLocalSearch] = React.useState(initialSearch)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    setLocalSearch(initialSearch)
  }, [initialSearch])

  function handleSearchChange(value: string) {
    setLocalSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (value) params.set("search", value)
      if (pageSize !== 10) params.set("limit", String(pageSize))
      params.set("page", "1")
      router.push(`/admin/webhooks?${params.toString()}`)
    }, 300)
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams()
    if (initialSearch) params.set("search", initialSearch)
    if (pageSize !== 10) params.set("limit", String(pageSize))
    params.set("page", String(newPage))
    router.push(`/admin/webhooks?${params.toString()}`)
  }

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by customer email, event id, type, or status..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <p className="ml-auto text-sm text-muted-foreground">
          {total} {total === 1 ? "event" : "events"}
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Event ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Processed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No webhook events found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const isExpanded = expandedRows.has(row.id)
                const hasError = !!row.processingError
                return (
                  <React.Fragment key={row.id}>
                    <TableRow>
                      <TableCell>
                        {hasError && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => toggleRow(row.id)}
                            aria-label={
                              isExpanded ? "Collapse error" : "Expand error"
                            }
                          >
                            {isExpanded ? (
                              <ChevronDown className="size-3" />
                            ) : (
                              <ChevronRight className="size-3" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(row.createdAt, "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        {row.customerEmail ? (
                          <span className="font-medium">
                            {row.customerEmail}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{row.type}</span>
                      </TableCell>
                      <TableCell>
                        <span className="block max-w-65 truncate font-mono text-xs">
                          {row.eventId}
                        </span>
                      </TableCell>
                      <TableCell>
                        {row.processed ? (
                          <Badge
                            variant={hasError ? "destructive" : "default"}
                            className="capitalize"
                          >
                            {hasError ? "Failed" : "Processed"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="capitalize">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.processedAt
                          ? formatDate(row.processedAt, "MMM d, yyyy HH:mm")
                          : "-"}
                      </TableCell>
                    </TableRow>
                    {isExpanded && hasError && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30 p-0">
                          <div className="px-4 py-3">
                            <span className="mb-2 block text-xs font-medium text-muted-foreground">
                              Error
                            </span>
                            <pre className="max-h-48 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
                              {row.processingError}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
