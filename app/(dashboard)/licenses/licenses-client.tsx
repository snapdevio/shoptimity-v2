"use client"
import Link from "next/link"

import { useState, useTransition, useEffect } from "react"
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  GlobeIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  ServerIcon,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Settings,
  Copy,
  Info,
  LayoutDashboard,
} from "lucide-react"

import { usePostHog } from "posthog-js/react"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import {
  assignDomain,
  updateDomain,
  deleteDomain,
  verifyStoreDomain,
} from "@/actions/domains"
import { cancelLicenseSubscription } from "@/actions/licenses"
import { normalizeDomain, validateDomain } from "@/lib/domains"
import { formatDate, formatDateRelative } from "@/lib/format"
import { toast } from "sonner"

interface Domain {
  id: string
  domainName: string
  createdAt: string
}

export interface License {
  id: string
  status: string
  totalSlots: number
  createdAt: string
  planName: string
  domains: Domain[]
  usedSlots: number
  isTrial: boolean
  trialEndsAt: string | null
  stripeSubscriptionId: string | null
  isLifetime: boolean
  planMode?: string
  stripeInvoiceUrl?: string | null
  amount?: number | null
  currency?: string | null
}

interface LicensesClientProps {
  licenses: License[]
}

function statusVariant(status: string) {
  switch (status) {
    case "active":
      return "default" as const
    case "revoked":
    case "past_due":
      return "destructive" as const
    default:
      return "secondary" as const
  }
}

export function LicensesClient({ licenses }: LicensesClientProps) {
  const [collision, setCollision] = useState<{
    open: boolean
    domainName: string
    onTryAgain?: () => void
  }>({
    open: false,
    domainName: "",
  })

  const onCollision = (domainName: string, onTryAgain?: () => void) => {
    setCollision({
      open: true,
      domainName,
      onTryAgain,
    })
  }
  if (licenses.length === 0) return <NoLicensesView />

  if (licenses.length === 1) {
    return (
      <div className="flex flex-col gap-8">
        <SingleLicenseView license={licenses[0]} onCollision={onCollision} />
        <LicenseGuide />
      </div>
    )
  }

  return <MultipleLicensesView licenses={licenses} onCollision={onCollision} />
}

function NoLicensesView() {
  return (
    <div className="space-y-12">
      <Card className="relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-md">
        {/* Glow Effect */}
        <div className="pointer-events-none absolute top-0 right-0 h-75 w-75 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[80px]" />

        <CardContent className="relative z-10 flex flex-col items-center justify-between gap-10 px-6 py-12 md:flex-row md:px-10">
          {/* LEFT SIDE CONTENT */}
          <div className="max-w-lg text-left">
            <h3 className="font-heading text-3xl font-bold tracking-tight text-gray-900">
              No licenses found
            </h3>

            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Purchase a license to start unlocking premium Shoptimity templates
              and optimizations for your Shopify stores.
            </p>

            <Link
              href="/plans"
              className="mt-6 inline-block rounded-full bg-orange-600 p-4 px-8 text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-orange-500"
            >
              View our pricing
            </Link>
          </div>

          {/* RIGHT SIDE IMAGE */}
          <div className="flex w-full justify-center md:w-auto md:justify-end">
            <img
              src="/assets/no-license.svg"
              alt="No licenses"
              className="h-auto w-65 md:w-[320px] lg:w-95"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MultipleLicensesView({
  licenses,
  onCollision,
}: {
  licenses: License[]
  onCollision: (domainName: string, onTryAgain?: () => void) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      {licenses.map((license) => (
        <LicenseCard
          key={license.id}
          license={license}
          onCollision={onCollision}
        />
      ))}

      <Card className="relative flex min-h-[300px] flex-col overflow-hidden border-dashed border-primary/30 bg-primary/5 transition-colors hover:border-primary/50 hover:bg-primary/10">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent" />
        <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
            <PlusIcon className="size-6 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">
            Purchase More Licenses
          </h3>
          <p className="mb-6 max-w-[85%] text-sm leading-relaxed text-muted-foreground">
            Purchase additional licenses to connect more stores. Manage
            additional stores and unlock premium features.
          </p>
          <Button asChild className="shadow-sm">
            <Link href="/plans">Purchase Licenses &rarr;</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}

function SingleLicenseView({
  license,
  onCollision,
}: {
  license: License
  onCollision: (domainName: string, onTryAgain?: () => void) => void
}) {
  const isActive = ["active", "trialing"].includes(license.status)
  const isCanceled = license.status === "canceled"
  const hasDomain = license.domains.length > 0
  const domain = license.domains[0]

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/30 p-1 shadow-2xl backdrop-blur-xl transition-all hover:bg-card/40">
      {/* Dynamic Background Glow */}
      <div
        className={cn(
          "pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full blur-[100px] transition-all duration-1000",
          isActive ? "bg-primary/10" : "bg-destructive/10"
        )}
      />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary/5 blur-[100px]" />

      <div className="relative z-10 grid grid-cols-1 gap-0 overflow-hidden rounded-[calc(1.5rem-1px)] lg:grid-cols-2">
        {/* Left Side: License Details */}
        <div className="flex flex-col border-border/50 p-8 lg:border-r">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <LayoutDashboard className="size-5" />
                </div>
                {/* <Badge
                  variant="secondary"
                  className="rounded-lg border-primary/10 bg-primary/5 px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary capitalize"
                >
                  {license.planMode ||
                    (license.isLifetime ? "lifetime" : "subscription")}
                </Badge> */}
                <h2 className="ms-2 text-3xl font-bold tracking-tight text-foreground">
                  {license.planName} Plan
                </h2>
              </div>
              <p className="mt-1 text-muted-foreground">
                Current license status and domain assignment
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              {license.status === "active" && !license.isTrial ? (
                <div className="flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-600 capitalize dark:text-green-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                  </span>
                  Active
                </div>
              ) : license.isTrial ? (
                <div className="flex flex-col items-end">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold capitalize",
                      isCanceled
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
                        : "border-blue-500/20 bg-blue-500/10 text-blue-600"
                    )}
                  >
                    {!isCanceled && (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                      </span>
                    )}
                    {isCanceled ? "Canceled" : "Free Trial"}
                  </div>
                  {license.trialEndsAt && (
                    <span className="mt-1 text-[10px] font-medium text-muted-foreground">
                      Ends {formatDateRelative(license.trialEndsAt)}
                    </span>
                  )}
                </div>
              ) : (
                <Badge
                  variant={statusVariant(license.status)}
                  className="px-3 py-1 capitalize"
                >
                  {license.status.replace("_", " ")}
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-auto space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Created
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {formatDate(license.createdAt)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Amount Paid
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {license.amount
                    ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: license.currency || "USD",
                      }).format(license.amount / 100)
                    : "Free"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Invoice
                </p>
                <div className="mt-1">
                  {license.stripeInvoiceUrl ? (
                    <a
                      href={license.stripeInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      View Receipt
                    </a>
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">
                      N/A
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  License ID
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(license.id)
                    toast.success("License ID copied")
                  }}
                  className="flex items-center gap-1 text-[10px] font-bold text-primary hover:opacity-80"
                >
                  <Copy className="size-3" />
                  Copy
                </button>
              </div>
              <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                {license.id}
              </p>
            </div>

            {((license.isTrial && !license.isLifetime) ||
              license.stripeSubscriptionId) &&
              (license.status === "active" ||
                license.status === "trialing") && (
                <div className="flex items-center justify-between rounded-2xl border border-destructive/10 bg-destructive/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <AlertCircleIcon className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold tracking-tight text-destructive uppercase">
                        Need to cancel?
                      </p>
                      <p className="text-[10px] text-destructive/70">
                        Cancel your trial before it ends.
                      </p>
                    </div>
                  </div>
                  <CancelSubscriptionDialog
                    licenseId={license.id}
                    isTrial={license.isTrial}
                  />
                </div>
              )}
          </div>
        </div>

        {/* Right Side: Domain Slot */}
        <div className="flex flex-col bg-muted/20 p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">
              Domain Assignment
            </h3>
            <Badge
              variant="outline"
              className={cn(
                "rounded-md border-primary/20 bg-primary/5 text-primary",
                !isActive && "opacity-50 grayscale"
              )}
            >
              {license.usedSlots}/{license.totalSlots} Slots
            </Badge>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            {license.totalSlots > 1 ? (
              <div className="space-y-4">
                {license.domains.map((domain) => (
                  <div
                    key={domain.id}
                    className={cn(
                      "group relative flex items-center justify-between rounded-2xl border border-border/50 bg-background/80 p-4 transition-all hover:border-primary/30 hover:bg-background",
                      !isActive && "cursor-not-allowed opacity-60 grayscale"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner ring-1 ring-primary/20">
                        <GlobeIcon className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">
                          {domain.domainName}
                        </h4>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Connected since {formatDate(domain.createdAt)}
                        </p>
                      </div>
                    </div>

                    {isActive && (
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <EditDomainDialog domain={domain} />
                        <DeleteDomainDialog domain={domain} />
                      </div>
                    )}
                  </div>
                ))}

                {Array.from({
                  length: Math.max(0, license.totalSlots - license.usedSlots),
                }).map((_, i) => (
                  <EmptySlotRow
                    key={`empty-${i}`}
                    licenseId={license.id}
                    isActive={isActive}
                    status={license.status}
                    onCollision={onCollision}
                  />
                ))}
              </div>
            ) : hasDomain ? (
              <div
                className={cn(
                  "group relative flex flex-col items-center justify-center rounded-3xl border-2 border-border/50 bg-background/80 p-10 text-center shadow-xl transition-all hover:border-primary/30 hover:bg-background",
                  !isActive && "cursor-not-allowed opacity-60 grayscale"
                )}
              >
                <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner ring-1 ring-primary/20 transition-transform group-hover:scale-110">
                  <GlobeIcon className="size-10" />
                </div>
                <h4 className="text-xl font-bold tracking-tight text-foreground">
                  {domain.domainName}
                </h4>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="size-4 text-green-500" />
                  <span>Connected since {formatDate(domain.createdAt)}</span>
                </div>

                <div className="mt-8 flex items-center gap-3">
                  {isActive ? (
                    <>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-xl"
                      >
                        <a
                          href={`https://${domain.domainName}/admin`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 size-4" />
                          Open Admin
                        </a>
                      </Button>
                      <EditDomainDialog domain={domain} />
                      <DeleteDomainDialog domain={domain} />
                    </>
                  ) : (
                    <Button
                      disabled
                      variant="outline"
                      size="sm"
                      className="rounded-xl opacity-50"
                    >
                      License Inactive
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <AddDomainDialog
                  licenseId={license.id}
                  trigger={
                    <button
                      disabled={!isActive}
                      className={cn(
                        "group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 p-12 text-center transition-all hover:border-primary/50 hover:bg-primary/10 focus:ring-2 focus:ring-primary/20 focus:outline-none",
                        !isActive && "cursor-not-allowed opacity-50 grayscale"
                      )}
                    >
                      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform group-hover:scale-110 group-active:scale-95">
                        <PlusIcon className="size-10" />
                      </div>
                      <h4 className="text-xl font-bold tracking-tight text-primary">
                        Assign Your Store
                      </h4>
                      <p className="mt-2 max-w-[200px] text-sm text-muted-foreground">
                        {isActive
                          ? "Enter your Shopify .myshopify.com domain to activate your license."
                          : "Please activate your license to assign a domain."}
                      </p>
                    </button>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LicenseGuide() {
  const steps = [
    {
      title: "Open Shopify Admin",
      description:
        "Login to your Shopify store admin panel at admin.shopify.com",
      icon: ExternalLink,
      link: "https://admin.shopify.com",
      linkText: "admin.shopify.com",
    },
    {
      title: "Navigate to Domains",
      description:
        "Click on Settings (bottom left) and then select the Domains section.",
      icon: Settings,
    },
    {
      title: "Copy Store Domain",
      description:
        "Copy your primary .myshopify.com domain (e.g., store-name.myshopify.com).",
      icon: Copy,
    },
    {
      title: "Activate License",
      description:
        "Paste the domain in the field above and click 'Add domain' to activate.",
      icon: CheckCircle2Icon,
    },
  ]

  return (
    <div className="mt-4">
      <div className="mb-6 flex items-center gap-2">
        <Info className="size-5 text-primary" />
        <h3 className="text-xl font-bold tracking-tight">
          How to assign your domain
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className="group relative flex flex-col rounded-3xl border border-border/50 bg-card/20 p-6 transition-all hover:bg-card/40 hover:shadow-lg"
          >
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform group-hover:scale-110">
              <step.icon className="size-6" />
            </div>
            <div className="mb-1 flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-black text-primary">
                {index + 1}
              </span>
              <h4 className="font-bold text-foreground">{step.title}</h4>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {step.description}
              {step.link && (
                <a
                  href={step.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                >
                  {step.linkText} <ExternalLink className="size-3" />
                </a>
              )}
            </p>
          </div>
        ))}
      </div>

      <Alert className="mt-8 rounded-2xl border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400">
        <AlertCircleIcon className="size-4 text-amber-600 dark:text-amber-500" />
        <AlertDescription className="text-xs font-medium">
          <strong>Important:</strong> Always use your{" "}
          <span className="italic">.myshopify.com</span> domain. Custom domains
          (like .com or .net) are not supported for license assignment because
          they can change, while the Shopify domain remains permanent.
        </AlertDescription>
      </Alert>
    </div>
  )
}

function LicenseCard({
  license,
  onCollision,
}: {
  license: License
  onCollision: (domainName: string, onTryAgain?: () => void) => void
}) {
  const slotsAvailable = license.totalSlots - license.usedSlots
  const isActive = ["active", "trialing"].includes(license.status)
  const emptySlots = Array.from({ length: Math.max(0, slotsAvailable) })

  return (
    <Card className="relative flex flex-col overflow-hidden border-border/50 bg-card/40 shadow-sm backdrop-blur-md transition-all hover:bg-card/60 hover:shadow-md dark:shadow-none">
      {isActive && (
        <div className="pointer-events-none absolute top-0 right-0 h-[150px] w-[250px] translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-[60px]" />
      )}
      <CardHeader className="border-b border-border/30 [.border-b]:pb-1">
        <div className="flex items-start justify-between">
          <div className="w-full space-y-1.5">
            <div className="flex w-full items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                {" "}
                {license.planName}
              </CardTitle>
              {license.status === "active" && !license.isTrial ? (
                <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-green-600 uppercase shadow-sm dark:text-green-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  </span>
                  Active
                </div>
              ) : license.isTrial &&
                (license.status === "active" ||
                  license.status === "trialing" ||
                  license.status === "canceled") ? (
                <div className="flex flex-col items-end gap-1">
                  <div
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-sm",
                      license.status === "canceled"
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    )}
                  >
                    {(license.status === "active" ||
                      license.status === "trialing") && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75"></span>
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                      </span>
                    )}
                    {license.status === "canceled" ? "Canceled" : "Free Trial"}
                  </div>
                  {license.trialEndsAt && (
                    <span className="mx-auto text-[10px] font-medium whitespace-nowrap text-muted-foreground">
                      Ends {formatDateRelative(license.trialEndsAt)}
                    </span>
                  )}
                </div>
              ) : license.isLifetime ? (
                <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-purple-600 uppercase shadow-sm dark:text-purple-400">
                  <CheckCircle2Icon className="size-3" />
                  Lifetime
                </div>
              ) : license.status === "past_due" ? (
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="destructive" className="shrink-0 uppercase">
                    Past Due
                  </Badge>
                  <span className="mx-auto text-[10px] font-medium whitespace-nowrap text-destructive">
                    Unpaid Payment
                  </span>
                </div>
              ) : (
                <Badge
                  variant={statusVariant(license.status)}
                  className="shrink-0 capitalize"
                >
                  {license.status}
                </Badge>
              )}
              {((license.isTrial && !license.isLifetime) ||
                license.stripeSubscriptionId) &&
                (license.status === "active" ||
                  license.status === "trialing") && (
                  <CancelSubscriptionDialog
                    licenseId={license.id}
                    isTrial={license.isTrial}
                  />
                )}
            </div>
            <CardDescription className="text-sm">
              <span className="font-medium text-foreground">
                {license.usedSlots}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {license.totalSlots}
              </span>{" "}
              domain slots filled
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 px-4">
        <div className="flex flex-col gap-3">
          {license.domains.map((domain) => (
            <DomainRow
              key={domain.id}
              domain={domain}
              isActive={isActive}
              onCollision={onCollision}
            />
          ))}

          {emptySlots.map((_, i) => (
            <EmptySlotRow
              key={`empty-${i}`}
              licenseId={license.id}
              isActive={isActive}
              status={license.status}
              onCollision={onCollision}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DomainRow({
  domain,
  isActive,
  onCollision,
}: {
  domain: Domain
  isActive: boolean
  onCollision: (domainName: string, onTryAgain?: () => void) => void
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-lg border border-border/60 bg-background/60 p-3 shadow-sm transition-all hover:border-border hover:bg-background/80 sm:flex-row sm:items-center",
        isActive
          ? "border-green-500/20 bg-green-500/10"
          : "pointer-events-none border-destructive/20 bg-red-500/5 opacity-60 grayscale select-none"
      )}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
          <GlobeIcon className="h-4 w-4" />
        </div>
        <div className="truncate">
          {isActive ? (
            <a
              href={`https://${domain.domainName}/admin`}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-sm leading-none font-medium hover:text-primary hover:underline"
            >
              {domain.domainName}
            </a>
          ) : (
            <span className="cursor-not-allowed truncate text-sm leading-none font-medium text-muted-foreground/60">
              {domain.domainName}
            </span>
          )}
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {isActive ? (
              <>
                <CheckCircle2Icon className="h-3 w-3 text-green-500" />
                <span className="truncate">Connected</span>
              </>
            ) : (
              <>
                <AlertCircleIcon className="h-3 w-3 text-destructive" />
                <span className="truncate font-medium text-destructive">
                  Inactive
                </span>
              </>
            )}
            <span className="opacity-50">&bull;</span>
            <span className="truncate">
              Assigned {formatDate(domain.createdAt)}
            </span>
          </p>
        </div>
      </div>
      {isActive && (
        <div className="mt-3 flex items-center justify-end gap-1 transition-opacity sm:mt-0 sm:opacity-50 sm:group-hover:opacity-100">
          <EditDomainDialog domain={domain} />
          <DeleteDomainDialog domain={domain} />
        </div>
      )}
    </div>
  )
}

function EmptySlotRow({
  licenseId,
  isActive,
  status,
  onCollision,
}: {
  licenseId: string
  isActive: boolean
  status: string
  onCollision: (domainName: string, onTryAgain?: () => void) => void
}) {
  if (!isActive) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/10 p-3 opacity-60 grayscale">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border">
            <span className="block h-0.5 w-3 rounded-full bg-current/40" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Locked Slot
            </p>
            <p className="mt-1 text-xs text-muted-foreground/40">
              {status === "revoked" ? "License revoked" : "License inactive"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AddDomainDialog
      licenseId={licenseId}
      // onCollision={onCollision}
      trigger={
        <button className="group flex w-full cursor-pointer flex-col justify-between rounded-lg border border-dashed border-primary/20 bg-primary/5 p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-primary/30 bg-background text-primary/60 transition-colors group-hover:text-primary">
              <PlusIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary/80 transition-colors group-hover:text-primary">
                Assign Domain
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground/70">
                Click to fill this empty slot
              </p>
            </div>
          </div>
        </button>
      }
    />
  )
}

function AddDomainDialog({
  licenseId,
  trigger,
}: {
  licenseId: string
  trigger?: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const posthog = usePostHog()

  const [form, setForm] = useState({
    name: "",
    error: null as string | null,
    isVerifying: false,
    isVerified: false,
    showCollisionModal: false,
    collidingDomain: "",
  })

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setForm((prev) => ({
        ...prev,
        name: "",
        error: null,
        isVerifying: false,
        isVerified: false,
      }))
    }
  }, [open])

  // Auto-verify logic with debounce
  useEffect(() => {
    if (!form.name || form.isVerified) return

    const timer = setTimeout(async () => {
      const normalized = normalizeDomain(form.name)
      const validation = validateDomain(normalized)

      if (!validation.valid) {
        setForm((prev) => ({
          ...prev,
          error: validation.error || "Invalid domain format",
          isVerifying: false,
        }))
        return
      }

      setForm((prev) => ({ ...prev, isVerifying: true, error: null }))

      try {
        const isValid = await verifyStoreDomain(normalized)
        if (isValid) {
          setForm((prev) => ({ ...prev, isVerified: true, isVerifying: false }))
          toast.success("Domain verified successfully")
        } else {
          setForm((prev) => ({
            ...prev,
            isVerifying: false,
            error: "Store not found or inactive. Please check the domain.",
          }))
        }
      } catch (err) {
        setForm((prev) => ({
          ...prev,
          isVerifying: false,
          error: "Verification failed. Try again later.",
        }))
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [form.name])

  function handleSubmit(formData: FormData) {
    if (!form.isVerified) {
      setForm((prev) => ({ ...prev, error: "Please wait for verification" }))
      return
    }

    const name = formData.get("domainName") as string
    const normalized = normalizeDomain(name)

    formData.set("licenseId", licenseId)
    formData.set("domainName", normalized)

    startTransition(async () => {
      const result = await assignDomain(formData)
      if (result?.error) {
        if (result.error.toLowerCase().includes("already assigned")) {
          setForm((prev) => ({
            ...prev,
            collidingDomain: normalized,
            showCollisionModal: true,
          }))
          setOpen(false)
        } else {
          setForm((prev) => ({ ...prev, error: result.error ?? null }))
        }
      } else {
        posthog.capture("domain_assigned", {
          domainName: normalized,
          licenseId,
        })
        setOpen(false)
      }
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            (trigger as any) || (
              <Button size="sm">
                <PlusIcon />
                Add Domain
              </Button>
            )
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Store Domain</DialogTitle>
            <DialogDescription>
              Enter the domain name you want to assign to this license.
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="grid gap-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="domainName">Domain name</Label>
              <div className="relative">
                <Input
                  id="domainName"
                  name="domainName"
                  type="text"
                  placeholder="example.myshopify.com"
                  value={form.name}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm((prev) => ({
                      ...prev,
                      name: val,
                      isVerified: false,
                      error: null,
                    }))
                  }}
                  required
                  disabled={isPending}
                  autoFocus
                  className={cn("pr-10", {
                    "border-destructive focus-visible:ring-destructive":
                      !!form.error,
                    "border-green-500/50 focus-visible:ring-green-500":
                      form.isVerified,
                  })}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  {form.isVerifying ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : form.isVerified ? (
                    <ShieldCheck className="size-4 text-green-500" />
                  ) : !!form.error ? (
                    <ShieldAlert className="size-4 text-destructive" />
                  ) : null}
                </div>
              </div>

              {form.error ? (
                <p className="mt-0.5 animate-in text-[11px] font-medium text-destructive fade-in slide-in-from-top-1">
                  {form.error}
                </p>
              ) : form.isVerified ? (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-green-600">
                  <CheckCircle2Icon className="size-3" />
                  Ready to connect
                </p>
              ) : null}

              <div className="mt-2 space-y-2.5 rounded-xl border border-border/50 bg-muted/30 p-4 text-start shadow-inner">
                <p className="text-[12px] leading-relaxed font-medium text-foreground/80">
                  Connect using your primary{" "}
                  <span className="text-primary italic">.myshopify.com</span>{" "}
                  domain.
                </p>
                <div className="flex items-start gap-2.5 text-[11px] leading-tight text-muted-foreground">
                  <div className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary ring-1 ring-primary/20">
                    i
                  </div>
                  <span>
                    Find this in your{" "}
                    <a
                      href="https://admin.shopify.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-primary transition-colors hover:underline"
                    >
                      Shopify Settings
                    </a>{" "}
                    &rarr; Domains
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                type="submit"
                disabled={isPending || !form.isVerified}
                className="cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Spinner className="mr-2" />
                    Adding...
                  </>
                ) : (
                  "Add domain"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CollisionErrorModal
        open={form.showCollisionModal}
        onOpenChange={(v) =>
          setForm((prev) => ({ ...prev, showCollisionModal: v }))
        }
        domainName={form.collidingDomain}
        onTryAgain={() => {
          setOpen(true)
        }}
      />
    </>
  )
}

function EditDomainDialog({ domain }: { domain: Domain }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const posthog = usePostHog()

  const [form, setForm] = useState({
    name: domain.domainName,
    error: null as string | null,
    isVerifying: false,
    isVerified: true, // Initial domain is already verified
    showCollisionModal: false,
    collidingDomain: "",
  })

  // Reset input when dialog closes or opens
  useEffect(() => {
    if (!open) {
      setForm((prev) => ({
        ...prev,
        error: null,
        isVerified: true,
        name: domain.domainName,
      }))
    } else {
      setForm((prev) => ({
        ...prev,
        name: domain.domainName,
        isVerified: true,
        error: null,
      }))
    }
  }, [open, domain.domainName])

  // Auto-verify logic with debounce
  useEffect(() => {
    if (
      !open ||
      !form.name ||
      form.name === domain.domainName ||
      form.isVerified
    ) {
      return
    }

    const timer = setTimeout(async () => {
      const normalized = normalizeDomain(form.name)
      const validation = validateDomain(normalized)

      if (!validation.valid) {
        setForm((prev) => ({
          ...prev,
          error: validation.error || "Invalid domain format",
          isVerifying: false,
        }))
        return
      }

      setForm((prev) => ({ ...prev, isVerifying: true, error: null }))

      try {
        const isValid = await verifyStoreDomain(normalized)
        if (isValid) {
          setForm((prev) => ({ ...prev, isVerified: true, isVerifying: false }))
          toast.success("Domain verified successfully")
        } else {
          setForm((prev) => ({
            ...prev,
            isVerifying: false,
            error: "Store not found or inactive. Please check the domain.",
          }))
        }
      } catch (err) {
        setForm((prev) => ({
          ...prev,
          isVerifying: false,
          error: "Verification failed. Try again later.",
        }))
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [form.name, domain.domainName, open])

  function handleSubmit(formData: FormData) {
    if (!form.isVerified) {
      setForm((prev) => ({ ...prev, error: "Please wait for verification" }))
      return
    }
    setForm((prev) => ({ ...prev, error: null }))
    const name = formData.get("domainName") as string
    const normalized = normalizeDomain(name)

    formData.set("domainId", domain.id)
    formData.set("domainName", normalized)

    startTransition(async () => {
      const result = await updateDomain(formData)
      if (result?.error) {
        if (result.error.toLowerCase().includes("already assigned")) {
          setForm((prev) => ({
            ...prev,
            name: domain.domainName, // Restore old domain
            collidingDomain: normalized,
            showCollisionModal: true,
          }))
          setOpen(false)
        } else {
          setForm((prev) => ({ ...prev, error: result.error ?? null }))
        }
      } else {
        posthog.capture("domain_updated", {
          oldDomainName: domain.domainName,
          newDomainName: normalized,
          domainId: domain.id,
        })
        setOpen(false)
      }
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant="ghost" size="icon-xs">
              <PencilIcon />
              <span className="sr-only">Edit domain</span>
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Store Domain</DialogTitle>
            <DialogDescription>
              Update the domain name for this assignment.
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="grid gap-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="editDomainName">Domain name</Label>
              <div className="relative">
                <Input
                  id="editDomainName"
                  name="domainName"
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm((prev) => ({
                      ...prev,
                      name: val,
                      isVerified: val === domain.domainName,
                      error: null,
                    }))
                  }}
                  required
                  disabled={isPending}
                  autoFocus
                  className={cn("pr-10", {
                    "border-destructive focus-visible:ring-destructive":
                      !!form.error,
                    "border-green-500/50 focus-visible:ring-green-500":
                      form.isVerified && form.name !== domain.domainName,
                  })}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  {form.isVerifying ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : form.isVerified && form.name !== domain.domainName ? (
                    <ShieldCheck className="size-4 text-green-500" />
                  ) : !!form.error ? (
                    <ShieldAlert className="size-4 text-destructive" />
                  ) : null}
                </div>
              </div>

              {form.error ? (
                <p className="mt-0.5 animate-in text-[11px] font-medium text-destructive fade-in slide-in-from-top-1">
                  {form.error}
                </p>
              ) : form.isVerified && form.name !== domain.domainName ? (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-green-600">
                  <CheckCircle2Icon className="size-3" />
                  Ready to connect
                </p>
              ) : null}

              <div className="mt-2 space-y-2.5 rounded-xl border border-border/50 bg-muted/30 p-4 text-start shadow-inner">
                <p className="text-[12px] leading-relaxed font-medium text-foreground/80">
                  Update using your primary{" "}
                  <span className="text-primary italic">.myshopify.com</span>{" "}
                  domain.
                </p>
                <div className="flex items-start gap-2.5 text-[11px] leading-tight text-muted-foreground">
                  <div className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary ring-1 ring-primary/20">
                    i
                  </div>
                  <span>
                    Find this in your{" "}
                    <a
                      href="https://admin.shopify.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-primary transition-colors hover:underline"
                    >
                      Shopify Settings
                    </a>{" "}
                    &rarr; Domains
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={isPending || !form.isVerified}>
                {isPending ? (
                  <>
                    <Spinner className="mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CollisionErrorModal
        open={form.showCollisionModal}
        onOpenChange={(v) =>
          setForm((prev) => ({ ...prev, showCollisionModal: v }))
        }
        domainName={form.collidingDomain}
        onTryAgain={() => setOpen(true)}
      />
    </>
  )
}
function DeleteDomainDialog({ domain }: { domain: Domain }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const posthog = usePostHog()

  function handleDelete() {
    setError(null)
    const formData = new FormData()
    formData.set("domainId", domain.id)
    startTransition(async () => {
      const result = await deleteDomain(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        posthog.capture("domain_deleted", {
          domainName: domain.domainName,
          domainId: domain.id,
        })
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-xs">
            <TrashIcon className="text-destructive" />
            <span className="sr-only">Delete domain</span>
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete domain</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{domain.domainName}</strong>{" "}
            from this license? This action will free up a domain slot.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                Deleting...
              </>
            ) : (
              "Delete domain"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface CollisionErrorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  domainName: string
  onTryAgain?: () => void
}

function CollisionErrorModal({
  open,
  onOpenChange,
  domainName,
  onTryAgain,
}: CollisionErrorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5">
            <AlertCircleIcon className="size-6" />
          </div>
          <DialogTitle className="text-xl">Domain Already Assigned</DialogTitle>
          <DialogDescription className="text-base text-balance text-muted-foreground">
            The domain <strong>{domainName}</strong> is already connected to
            another license in our system.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 rounded-lg border border-border/50 bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
          A domain can only be assigned to one license at a time. Please verify
          the domain name or contact support if you believe this is an error.
        </div>
        <DialogFooter className="mt-4 flex flex-row gap-2">
          {onTryAgain && (
            <DialogClose
              render={
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onTryAgain}
                />
              }
            >
              Try another
            </DialogClose>
          )}
          <DialogClose render={<Button className="flex-1" />}>
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CancelSubscriptionDialog({
  licenseId,
  isTrial,
}: {
  licenseId: string
  isTrial?: boolean
}) {
  if (!isTrial) return null

  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const posthog = usePostHog()

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelLicenseSubscription(licenseId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(
          `${isTrial ? "Trial" : "Subscription"} cancellation requested successfully`
        )
        posthog.capture("subscription_cancel_requested", { licenseId })
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 border px-2 text-[10px] font-bold tracking-tight transition-colors",
              isTrial
                ? "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
                : "border-destructive/80 text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
            )}
          >
            <div className="flex items-center gap-1">
              <TrashIcon className="size-3" />
              <span>Cancel Trial</span>
            </div>
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Cancel {isTrial ? "Free Trial" : "Subscription"}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel the{" "}
            {isTrial ? "free trial" : "subscription"} for this license? Access
            to your domain slots will be revoked immediately upon cancellation.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Not now
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                Processing...
              </>
            ) : (
              "Confirm Cancellation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
