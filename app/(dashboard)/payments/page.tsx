export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { eq, desc, count } from "drizzle-orm"
import { CreditCardIcon, FileText } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Payments History | Shoptimity",
  description: "View your payment history and transaction details.",
  alternates: {
    canonical: "https://shoptimity.com/payments",
  },
  robots: {
    index: false,
    follow: false,
  },
}

import { getAppSession } from "@/lib/auth-session"
import { db } from "@/db"
import { payments } from "@/db/schema"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"

const PAGE_SIZE = 10

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function statusVariant(status: string) {
  switch (status) {
    case "completed":
    case "paid":
      return "default" as const
    case "pending":
      return "secondary" as const
    case "failed":
    case "refunded":
      return "destructive" as const
    default:
      return "outline" as const
  }
}

function generatePaginationRange(
  current: number,
  total: number
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | "ellipsis")[] = [1]

  if (current > 3) {
    pages.push("ellipsis")
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push("ellipsis")
  }

  if (total > 1) {
    pages.push(total)
  }

  return pages
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await getAppSession()
  if (!session) redirect("/login")

  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1)

  const [{ value: totalCount }] = await db
    .select({ value: count() })
    .from(payments)
    .where(eq(payments.userId, session.userId))

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  const userPayments = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      currency: payments.currency,
      status: payments.status,
      stripeSessionId: payments.stripeSessionId,
      stripeInvoiceUrl: payments.stripeInvoiceUrl,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(eq(payments.userId, session.userId))
    .orderBy(desc(payments.createdAt))
    .limit(PAGE_SIZE)
    .offset((safePage - 1) * PAGE_SIZE)

  const paginationRange = generatePaginationRange(safePage, totalPages)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Payments History
        </h1>
        <p className="text-sm text-muted-foreground">
          View your payment history.
        </p>
      </div>

      {totalCount === 0 ? (
        <Card className="relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-md">
          <div className="pointer-events-none absolute top-0 right-0 h-[300px] w-[300px] translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[80px]" />
          <CardContent className="relative z-10 flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <CreditCardIcon className="size-8 text-primary" />
            </div>
            <h3 className="font-heading text-2xl font-semibold tracking-tight">
              No payments yet
            </h3>
            <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
              Your payment history will appear here after your first purchase.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Stripe Session ID
                    </TableHead>
                    <TableHead>Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.createdAt)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.amount, payment.currency)}
                      </TableCell>
                      <TableCell className="uppercase">
                        {payment.currency}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant(payment.status)}
                          className="capitalize"
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden max-w-50 truncate font-mono text-xs text-muted-foreground md:table-cell">
                        {payment.stripeSessionId}
                      </TableCell>
                      <TableCell>
                        {payment.status === "paid" &&
                        payment.stripeInvoiceUrl ? (
                          <a
                            href={payment.stripeInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 font-heading text-xs font-medium text-primary hover:underline"
                            title="View Invoice"
                          >
                            <FileText className="size-3.5" />
                            <span>View Invoice</span>
                          </a>
                        ) : (
                          <span className="mx-auto text-center">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {safePage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href={`/payments?page=${safePage - 1}`}
                    />
                  </PaginationItem>
                )}
                {paginationRange.map((page, i) =>
                  page === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href={`/payments?page=${page}`}
                        isActive={page === safePage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                {safePage < totalPages && (
                  <PaginationItem>
                    <PaginationNext href={`/payments?page=${safePage + 1}`} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(safePage * PAGE_SIZE, totalCount)} of {totalCount}{" "}
            payments
          </p>
        </>
      )}
    </div>
  )
}
