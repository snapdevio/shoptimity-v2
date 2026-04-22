import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-zinc-50/50 px-4 py-12 dark:bg-zinc-950/50">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w- auto relative h-10">
            <img
              src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT || ""}/assets/logo.svg`}
              alt="Shoptimity Logo"
              className="h-10 w-auto object-contain"
            />
          </div>
          {/* <span className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Shoptimity
          </span> */}
        </Link>
        <p className="mt-2 text-sm text-muted-foreground">
          Premium Conversion-Optimized Shopify Theme
        </p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
