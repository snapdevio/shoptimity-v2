import Link from "next/link"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

export default function NotFoundContent() {
  return (
    <>
      <div className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-125 w-125 -translate-x-1/2 -translate-y-1/2 scale-150 rounded-full bg-[radial-gradient(circle,rgba(255,89,36,0.08)_0%,rgba(255,89,36,0)_70%)] opacity-50 blur-3xl" />
      <div className="pointer-events-none absolute -top-24 -right-24 -z-10 h-100 w-100 rounded-full bg-[radial-gradient(circle,rgba(255,111,181,0.05)_0%,rgba(255,111,181,0)_70%)] opacity-30 blur-3xl" />

      <div className="relative z-10 w-full max-w-4xl text-center">
        <h1 className="mb-6 font-[Lexend] text-[120px] leading-tight font-bold md:text-[200px]">
          <span className="text-gradient-orange-pink animate-in duration-700 fade-in slide-in-from-bottom-8">
            4
          </span>
          <span className="text-gradient-orange-pink animate-in delay-100 duration-700 fade-in slide-in-from-bottom-12">
            0
          </span>
          <span className="text-gradient-orange-pink animate-in delay-200 duration-700 fade-in slide-in-from-bottom-16">
            4
          </span>
        </h1>

        <h2 className="mb-4 font-heading text-3xl font-bold text-base-content md:text-5xl">
          Whoops! Lost in Shoptimity?
        </h2>

        <p className="mx-auto mb-10 max-w-lg font-sans text-lg text-base-content-muted/80">
          It seems like you&apos;re lost in Shoptimity. The page you are looking
          for doesn&apos;t exist, isn&apos;t available or was loaded
          incorrectly.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className={cn(
              "cursor-pointer",
              buttonVariants({ variant: "default", size: "lg" }),
              "h-[58px] min-w-[220px] rounded-full text-base font-bold shadow-xl shadow-orange-500/20 transition-all duration-300 hover:-translate-y-1 hover:brightness-110 active:scale-95"
            )}
          >
            Back to Home
          </Link>
          <Link
            href="/contact"
            className={cn(
              "cursor-pointer",
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-[58px] min-w-[220px] rounded-full bg-white/50 text-base font-bold backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-lg active:scale-95"
            )}
          >
            Contact Support
          </Link>
        </div>
      </div>

      <div className="absolute top-[20%] left-[15%] h-4 w-4 animate-pulse rounded-full bg-primary/20 duration-3000" />
      <div className="absolute top-[60%] right-[10%] h-6 w-6 animate-pulse rounded-full bg-secondary/20 duration-4000" />
      <div className="absolute bottom-[20%] left-[10%] h-3 w-3 animate-pulse rounded-full bg-primary/30 duration-2500" />
      <div className="absolute bottom-[10%] left-[20%] h-5 w-5 animate-pulse rounded-full bg-primary/30 duration-2000" />
      <div className="absolute bottom-[26%] left-[45%] h-3 w-3 animate-pulse rounded-full bg-primary/30 duration-1500" />
      <div className="absolute bottom-[37%] left-[29%] h-6 w-6 animate-pulse rounded-full bg-primary/30 duration-1000" />
      <div className="absolute bottom-[75%] left-[50%] h-4 w-4 animate-pulse rounded-full bg-primary/30 duration-500" />
      <div className="absolute bottom-[60%] left-[85%] h-4 w-4 animate-pulse rounded-full bg-primary/30 duration-5000" />
      <div className="absolute bottom-[48%] left-[70%] h-3 w-3 animate-pulse rounded-full bg-primary/30 duration-4200" />
    </>
  )
}
