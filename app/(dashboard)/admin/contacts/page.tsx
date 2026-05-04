import { getMetadata } from "@/lib/metadata"
import { getContacts, updateContactStatus } from "@/actions/contact"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export const metadata = getMetadata({
  title: "Contact Requests",
  description:
    "Manage incoming support requests and customer inquiries from the Shoptimity website.",
  pathname: "/admin/contacts",
  robots: { index: false, follow: false },
})
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { ContactStatusBadge } from "@/app/(dashboard)/admin/contacts/status-badge"
import { ContactActions } from "@/app/(dashboard)/admin/contacts/actions"

export const dynamic = "force-dynamic"

export default async function AdminContactsPage() {
  const contacts = await getContacts()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Contact Requests
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage and respond to user messages and inquiries.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Messages</CardTitle>
          <CardDescription>
            A list of all contact form submissions from the website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No contact requests found.
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(contact.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{contact.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {contact.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {contact.subject}
                    </TableCell>
                    <TableCell>
                      <ContactStatusBadge status={contact.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ContactActions contact={contact} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
