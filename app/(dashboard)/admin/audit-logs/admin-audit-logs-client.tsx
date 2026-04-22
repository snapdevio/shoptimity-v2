"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { formatDate } from "@/lib/format"
import { ChevronDown, ChevronRight, Search } from "lucide-react"
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

interface AuditLog {
  id: string
  actorUserId: string | null
  action: string
  entityType: string
  entityId: string
  metadataJson: unknown
  createdAt: Date
}

interface AdminAuditLogsClientProps {
  data: AuditLog[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  initialSearch: string
}

export function AdminAuditLogsClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  initialSearch,
}: AdminAuditLogsClientProps) {
  const router = useRouter()
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [localSearch, setLocalSearch] = React.useState(initialSearch)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    setLocalSearch(initialSearch)
  }, [initialSearch])

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
      router.push(`/admin/audit-logs?${params.toString()}`)
    }, 300)
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams()
    if (initialSearch) params.set("search", initialSearch)
    if (pageSize !== 10) params.set("limit", String(pageSize))
    params.set("page", String(newPage))
    router.push(`/admin/audit-logs?${params.toString()}`)
  }

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <p className="ml-auto text-sm text-muted-foreground">
          {total} {total === 1 ? "entry" : "entries"}
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Date</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity Type</TableHead>
              <TableHead>Entity ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const isExpanded = expandedRows.has(row.id)
                const hasMetadata =
                  row.metadataJson !== null && row.metadataJson !== undefined

                return (
                  <React.Fragment key={row.id}>
                    <TableRow>
                      <TableCell>
                        {hasMetadata && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => toggleRow(row.id)}
                            aria-label={
                              isExpanded
                                ? "Collapse metadata"
                                : "Expand metadata"
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
                        {row.actorUserId ? (
                          <span className="font-mono text-xs">
                            {row.actorUserId.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground">system</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{row.entityType}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">
                          {row.entityId.slice(0, 12)}
                          {row.entityId.length > 12 ? "..." : ""}
                        </span>
                      </TableCell>
                    </TableRow>
                    {isExpanded && hasMetadata && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30 p-0">
                          <div className="px-4 py-3">
                            <span className="mb-2 block text-xs font-medium text-muted-foreground">
                              Metadata
                            </span>
                            <pre className="max-h-48 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
                              {JSON.stringify(row.metadataJson, null, 2)}
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
