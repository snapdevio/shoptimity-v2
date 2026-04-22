"use client"

import { Badge } from "@/components/ui/badge"

export function ContactStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">Pending</Badge>
    case "responded":
      return (
        <Badge className="bg-green-500 hover:bg-green-600">Responded</Badge>
      )
    case "archived":
      return <Badge variant="outline">Archived</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}
