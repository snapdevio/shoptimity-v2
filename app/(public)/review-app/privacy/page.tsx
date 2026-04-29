import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { ShieldCheck, Lock, Eye, FileText, Mail } from "lucide-react"

export const metadata = {
  title: "Review App Privacy Policy | Shoptimity",
  description:
    "Privacy Policy for the Shoptimity Review App. Learn how we handle your data and protect your privacy.",
  alternates: {
    canonical: "https://shoptimity.com/review-app/privacy",
  },
}

export default function ReviewAppPrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-base-100 pt-32 pb-20">
      {/* Decorative background elements */}
      <div className="absolute -top-24 -right-24 h-96 w-96 shrink-0 rounded-full bg-[#ff602e]/5 blur-3xl" />
      <div className="absolute top-1/2 -left-24 h-72 w-72 shrink-0 rounded-full bg-[#ff6fb5]/5 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex animate-in items-center gap-2 rounded-full border border-black/5 bg-white/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm duration-500 fade-in slide-in-from-bottom-3">
            <ShieldCheck className="h-3.5 w-3.5 text-[#ff602e]" />
            Privacy First
          </div>
          <h1 className="mb-6 animate-in font-heading text-5xl font-bold tracking-tight text-[#1a1a1a] duration-700 fade-in slide-in-from-bottom-4 md:text-6xl">
            Review App{" "}
            <span className="text-gradient-orange-pink">Privacy Policy</span>
          </h1>
          <p className="mx-auto max-w-2xl animate-in text-lg text-muted-foreground duration-1000 slide-in-from-bottom-5 fade-in">
            Last updated: April 2, 2026. We are committed to protecting your
            privacy and ensuring your data is handled with transparency and
            care.
          </p>
        </div>

        <div className="animate-in rounded-3xl border border-white bg-white/70 p-8 shadow-2xl shadow-black/5 backdrop-blur-md duration-1000 zoom-in-95 fade-in md:p-12">
          <div className="prose prose-sm max-w-none space-y-12 text-[#1a1a1a]">
            <section className="group">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#ff602e] transition-transform duration-300 group-hover:scale-110">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="m-0 font-heading text-2xl font-semibold">
                  1. Introduction
                </h2>
              </div>
              <p className="text-base leading-relaxed text-muted-foreground">
                Welcome to the Shoptimity Review App Privacy Policy. This
                document outlines how we collect, use, and safeguard your
                information when you use our review management and display
                services. Our goal is to provide a seamless experience while
                maintaining the highest standards of data protection for both
                merchants and their customers.
              </p>
            </section>

            <Separator className="bg-black/5" />

            <section className="group">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-[#ff6fb5] transition-transform duration-300 group-hover:scale-110">
                  <Eye className="h-5 w-5" />
                </div>
                <h2 className="m-0 font-heading text-2xl font-semibold">
                  2. Information We Collect
                </h2>
              </div>
              <p className="mb-6 text-base leading-relaxed text-muted-foreground">
                To provide the Review App services effectively, we collect the
                following types of information:
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-black/5 bg-white/50 p-5 transition-colors duration-300 hover:border-[#ff602e]/20">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wider text-[#1a1a1a] uppercase">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#ff602e]" />
                    Merchant Data
                  </h3>
                  <p className="m-0 text-sm text-muted-foreground">
                    Store name, domain, email address, and API keys required for
                    Shopify integration.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-white/50 p-5 transition-colors duration-300 hover:border-[#ff6fb5]/20">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wider text-[#1a1a1a] uppercase">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#ff6fb5]" />
                    Reviewer Content
                  </h3>
                  <p className="m-0 text-sm text-muted-foreground">
                    Customer names, email addresses, star ratings, review text,
                    and uploaded images or videos.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-white/50 p-5 transition-colors duration-300 hover:border-[#ff602e]/20">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wider text-[#1a1a1a] uppercase">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#ff602e]" />
                    Technical Logs
                  </h3>
                  <p className="m-0 text-sm text-muted-foreground">
                    IP addresses, browser types, and device information to
                    monitor app performance and security.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-white/50 p-5 transition-colors duration-300 hover:border-[#ff6fb5]/20">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wider text-[#1a1a1a] uppercase">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#ff6fb5]" />
                    Usage Metrics
                  </h3>
                  <p className="m-0 text-sm text-muted-foreground">
                    How you interact with the dashboard, configuration settings,
                    and display customizations.
                  </p>
                </div>
              </div>
            </section>

            <Separator className="bg-black/5" />

            <section className="group">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500 transition-transform duration-300 group-hover:scale-110">
                  <Lock className="h-5 w-5" />
                </div>
                <h2 className="m-0 font-heading text-2xl font-semibold">
                  3. How We Use Information
                </h2>
              </div>
              <p className="text-base leading-relaxed text-muted-foreground">
                We use the collected data exclusively to power the Review App
                features, including:
              </p>
              <ul className="mt-4 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
                {[
                  "Displaying reviews on your store",
                  "Sending automatic review requests",
                  "Analyzing review sentiment",
                  "Preventing spam and fraud",
                  "Improving app performance",
                  "Providing customer support",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-black/[0.03] bg-black/[0.02] p-3 text-sm text-muted-foreground"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <Separator className="bg-black/5" />

            <section className="group">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-500 transition-transform duration-300 group-hover:scale-110">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="m-0 font-heading text-2xl font-semibold">
                  4. Data Security
                </h2>
              </div>
              <p className="text-base leading-relaxed text-muted-foreground">
                Your data security is our top priority. We implement
                industry-leading measures, including end-to-end encryption for
                review content, secure database hosting, and regular security
                audits. Access to merchant data is strictly restricted to
                authorized personnel who need the information to perform
                specific tasks.
              </p>
            </section>

            <Separator className="bg-black/5" />

            <div className="rounded-2xl border border-white/40 bg-gradient-to-br from-[#ff602e]/10 to-[#ff6fb5]/10 p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <Mail className="h-6 w-6 text-[#ff602e]" />
              </div>
              <h3 className="mb-2 font-heading text-xl font-bold text-[#1a1a1a]">
                Have questions?
              </h3>
              <p className="mb-6 text-muted-foreground">
                Our privacy team is here to help you understand how we protect
                your data.
              </p>
              <Link
                href="/contact"
                className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#1a1a1a] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all hover:scale-105 active:scale-95"
              >
                Contact Privacy Team
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Shoptimity LLC. All rights reserved.
          </p>
          <div className="mt-4 flex justify-center gap-6">
            <Link
              href="/terms"
              className="cursor-pointer transition-colors hover:text-[#ff602e]"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy-policy"
              className="cursor-pointer transition-colors hover:text-secondary"
            >
              Main Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
