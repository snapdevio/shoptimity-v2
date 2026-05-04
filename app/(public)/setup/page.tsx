import { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { getMetadata } from "@/lib/metadata"
import {
  CreditCard,
  Mail,
  LogIn,
  Globe,
  Download,
  ShieldCheck,
  PlayCircle,
  ArrowRight,
} from "lucide-react"

export const metadata = getMetadata({
  title: "Theme Setup Guide",
  description:
    "Learn how to set up and customize your Shoptimity Shopify theme with our easy-to-follow guide.",
  pathname: "/setup",
})

const steps = [
  {
    icon: CreditCard,
    title: "Choose a Plan",
    description:
      "Browse our premium plan designed for focused growth. Each account includes a single license slot, which can be used for one Shopify store domain at a time. This ensures optimal performance and dedicated usage for your store.",
    image: "/shoptimity-v2/assets/setup/pricing.webp",
  },
  {
    icon: Mail,
    title: "Complete Checkout",
    description:
      "Our checkout process is fast and fully secured by Stripe. Simply enter your payment details, and you'll receive an instant confirmation email and access to your customer portal.",
    image: "/shoptimity-v2/assets/setup/checkout.webp",
  },
  {
    icon: LogIn,
    title: "Access Your Dashboard",
    description:
      "Sign in using Google or your email and password. Once logged in, you can manage your theme licenses and assets from a single dashboard.",
    image: "/shoptimity-v2/assets/setup/login.webp",
  },
  {
    icon: Globe,
    title: "Add Your Store Domains",
    description:
      "Enter your Shopify .myshopify.com domain to assign your license. Each account supports one active domain per license slot.",
    image: "/shoptimity-v2/assets/setup/assign-domain.webp",
  },
  {
    icon: Download,
    title: "Download Theme Templates",
    description:
      "Access our premium template library and download the latest theme builds in ZIP format. Our themes are optimized for performance and conversion right out of the box.",
    image: "/shoptimity-v2/assets/setup/download-template.webp",
  },
  {
    icon: ShieldCheck,
    title: "Final Activation",
    description:
      "Upload the ZIP file to your Shopify Admin. Your license will automatically activate once the theme is installed on a registered domain. You're now ready to build!",
    image: "/shoptimity-v2/assets/setup/assign-license.webp",
  },
]

export default function SetupPage() {
  return (
    <div className="bg-base-100 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            Setup Guide
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Follow these simple steps to get your Shopify theme licenses up and
            running in minutes.
          </p>
        </div>

        <Card className="mt-12">
          <CardHeader>
            <div className="flex items-center gap-3">
              <PlayCircle className="size-5 text-primary" />
              <CardTitle>Video Walkthrough</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="aspect-video overflow-hidden rounded-lg bg-muted">
              <video
                className="size-full"
                controls
                preload="metadata"
                src={
                  process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT
                    ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT}/video/step.mp4`
                    : ""
                }
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Steps Section */}
      <section className="mt-5 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-32">
            {steps.map((step, index: number) => (
              <div
                key={step.title}
                className={cn(
                  "flex flex-col gap-12 lg:items-center",
                  index % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
                )}
              >
                {/* Text Content */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-white shadow-lg shadow-black/10">
                      {index + 1}
                    </span>
                    <div className="h-px flex-1 bg-linear-to-r from-border to-transparent" />
                  </div>

                  <div className="space-y-4">
                    <h2 className="flex items-center gap-3 font-heading text-3xl font-bold tracking-tight text-base-content">
                      <step.icon className="size-8 text-primary" />
                      {step.title}
                    </h2>
                    <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  <div className="pt-4">
                    <Link
                      href={index === 0 ? "/plans" : "/contact"}
                      className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                      {index === 0 ? "Browse Plans" : "Learn More"}
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>

                {/* Visual Content */}
                <div className="flex-1">
                  <div className="group relative overflow-hidden rounded-3xl bg-base-200 shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <Image
                      src={
                        process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT
                          ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT}${step.image}`
                          : "about:blank"
                      }
                      alt={step.title}
                      width={300}
                      height={300}
                      className="w-full object-cover shadow-2xl"
                      priority={index < 2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-black py-24">
        <div className="pointer-events-none absolute top-0 left-0 h-full w-full opacity-10">
          <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_20%_30%,#fafaf8_0%,transparent_50%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center text-white">
          <h2 className="font-heading text-4xl font-extrabold tracking-tight">
            Ready to scale your commerce?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-white/70">
            Join hundreds of high-growth brands building their stores with
            Shoptimity themes. Set up in under 5 minutes.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/plans"
              className="cursor-pointer rounded-xl bg-white px-8 py-4 font-bold text-primary shadow-xl transition-all hover:bg-base-100 hover:shadow-2xl"
            >
              Choose Your Plan
            </Link>
            <Link
              href="/contact"
              className="cursor-pointer rounded-xl border-2 border-white/20 px-8 py-4 font-bold text-white transition-all hover:bg-white/5"
            >
              Talk to Our Experts
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
