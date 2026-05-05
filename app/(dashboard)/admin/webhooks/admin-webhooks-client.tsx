"use client"

import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/format"
import { useState, useEffect } from "react"
import { CheckCircle2, XCircle, Clock } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { adminGetWebhookEventPayload } from "@/actions/admin"

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

interface AdminWebhookEventsClientProps {
  data: WebhookEvent[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  initialSearch: string
}

export function AdminWebhookEventsClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  initialSearch,
}: AdminWebhookEventsClientProps) {
  const router = useRouter()
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null)
  const [payload, setPayload] = useState<any>(null)
  const [loadingPayload, setLoadingPayload] = useState(false)
  const [payloadError, setPayloadError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedEvent) {
      setLoadingPayload(true)
      setPayloadError(null)
      adminGetWebhookEventPayload(selectedEvent.eventId)
        .then((res) => {
          if (res.error) {
            setPayloadError(res.error)
          } else {
            setPayload(res.payload)
          }
        })
        .catch(() => setPayloadError("An unexpected error occurred"))
        .finally(() => setLoadingPayload(false))
    } else {
      setPayload(null)
      setPayloadError(null)
    }
  }, [selectedEvent])

  function handleSearchChange(value: string) {
    const params = new URLSearchParams()
    if (value) params.set("search", value)
    if (pageSize !== 10) params.set("limit", String(pageSize))
    params.set("page", "1")
    router.push(`/admin/webhooks?${params.toString()}`)
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams()
    if (initialSearch) params.set("search", initialSearch)
    if (pageSize !== 10) params.set("limit", String(pageSize))
    params.set("page", String(newPage))
    router.push(`/admin/webhooks?${params.toString()}`)
  }

  const columns: DataTableColumn<WebhookEvent>[] = [
    {
      key: "createdAt",
      header: "Received At",
      render: (row) => formatDate(row.createdAt, "MMM d, HH:mm:ss"),
    },
    {
      key: "type",
      header: "Event Type",
      render: (row) => (
        <button
          onClick={() => setSelectedEvent(row)}
          className="text-left font-medium text-primary hover:underline"
        >
          {row.type}
        </button>
      ),
    },
    {
      key: "customerEmail",
      header: "Customer",
      render: (row) => (
        <span className="text-xs">{row.customerEmail || "-"}</span>
      ),
    },
    {
      key: "eventId",
      header: "Stripe ID",
      render: (row) => (
        <span className="font-mono text-[10px] text-muted-foreground">
          {row.eventId}
        </span>
      ),
    },
    {
      key: "processed",
      header: "Status",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.processed ? (
            <Badge variant="default" className="gap-1 px-1.5">
              <CheckCircle2 className="size-3" />
              Processed
            </Badge>
          ) : row.processingError ? (
            <Badge variant="destructive" className="gap-1 px-1.5">
              <XCircle className="size-3" />
              Failed
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 px-1.5">
              <Clock className="size-3" />
              Pending
            </Badge>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable<WebhookEvent>
        columns={columns}
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        searchValue={initialSearch}
        searchPlaceholder="Search by type or ID..."
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        emptyMessage="No webhook events recorded."
      />

      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2">
              Webhook Event Detail
              <Badge variant="outline" className="font-mono text-[10px]">
                {selectedEvent?.eventId}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Full payload received from Stripe for{" "}
              <strong>{selectedEvent?.type}</strong>.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="min-h-0 flex-1 px-6">
              <div className="h-[60vh] overflow-auto rounded-md border bg-muted/50 p-4">
                <div className="space-y-4">
                  {selectedEvent.processingError && (
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                      <p className="flex items-center gap-1.5 font-semibold">
                        <XCircle className="size-4" /> Processing Error
                      </p>
                      <p className="mt-1 font-mono text-xs">
                        {selectedEvent.processingError}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                      Event Payload
                    </p>
                    {loadingPayload ? (
                      <div className="flex h-32 items-center justify-center">
                        <Spinner className="size-6 text-muted-foreground" />
                      </div>
                    ) : payloadError ? (
                      <div className="rounded-md bg-destructive/5 p-4 text-center">
                        <p className="text-sm text-destructive">
                          {payloadError}
                        </p>
                      </div>
                    ) : (
                      <pre className="font-mono text-xs break-all whitespace-pre-wrap">
                        {JSON.stringify(payload, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end px-6 pt-2 pb-6">
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
