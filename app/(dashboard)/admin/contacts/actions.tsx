"use client"

import { useState, useTransition } from "react"
import { updateContactStatus } from "@/actions/contact"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Clock, Mail, CheckCircle, Archive, Eye } from "lucide-react"
import { toast } from "sonner"

export function ContactActions({ contact }: { contact: any }) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function onUpdateStatus(status: string) {
    startTransition(async () => {
      const result = await updateContactStatus(contact.id, status)
      if (result.success) {
        toast.success(`Status updated to ${status}`)
      } else {
        toast.error("Failed to update status")
      }
    })
  }

  const formattedDate = contact.createdAt
    ? new Date(contact.createdAt).toLocaleDateString()
    : null

  return (
    <>
      <div className="flex min-w-[140px] items-center justify-end gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
          onClick={() => setOpen(true)}
          title="View Message"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-green-500 hover:bg-green-50 hover:text-green-600"
          onClick={() => onUpdateStatus("responded")}
          title="Mark Responded"
          disabled={isPending}
        >
          <CheckCircle className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => onUpdateStatus("archived")}
          title="Archive"
          disabled={isPending}
        >
          <Archive className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
          onClick={() => onUpdateStatus("pending")}
          title="Set Pending"
          disabled={isPending}
        >
          <Clock className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{contact.subject}</DialogTitle>
            <DialogDescription>
              From {contact.name} ({contact.email}){" "}
              {formattedDate && (
                <span suppressHydrationWarning>on {formattedDate}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">
              {contact.message}
            </div>
            <div className="flex justify-end gap-2">
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                <Mail className="mr-2 h-4 w-4" />
                Reply via Email
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
