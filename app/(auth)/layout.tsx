"use client"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh bg-zinc-50/50 dark:bg-zinc-950/50">
      {children}
    </div>
  )
}
