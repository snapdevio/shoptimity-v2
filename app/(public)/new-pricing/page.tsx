"use client"

import React, { useState } from "react"
import { Check, X, ShieldCheck, Zap, Globe, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const NEW_PRICING_FEATURES = {
  free: [
    { name: "3-4 Basic Industry Templates", included: true },
    { name: "Core Sections (Hero, FAQ, Footer)", included: true },
    { name: "Standard Widgets (Rollover, Slideshow)", included: true },
    { name: "1 Store License Slot", included: true },
    { name: "Standard Email Support", included: true },
    { name: "Premium Widgets (Swatches, Video, etc.)", included: false },
    { name: "Advanced Conversion Tools (Upsells, Bundles)", included: false },
    { name: "Mobile-First Premium Architecture", included: false },
    { name: "VIP Priority Support & Community", included: false },
  ],
  paid: [
    { name: "15+ Premium Niche Blueprints", included: true, highlight: true },
    { name: "30+ Advanced Sections (Mega Menu, Tables)", included: true },
    { name: "All 8+ Premium Widgets (Swatches, Video)", included: true },
    {
      name: "Advanced AOV Boosters (Upsells, Bundles)",
      included: true,
      highlight: true,
    },
    { name: "Mobile-First Premium Architecture", included: true },
    { name: "VIP Priority Support & Community Access", included: true },
    { name: "Global Multi-Currency Switcher", included: true },
    { name: "Built-in Advertorial Builders", included: true },
    { name: "Unlimited Updates & Support", included: true },
  ],
}

export default function NewPricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly"
  )

  const monthlyPrice = 19
  const yearlyPrice = 159
  const discount = Math.round(
    ((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100
  )

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Background Decorative Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-orange-100/50 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[35%] w-[35%] rounded-full bg-pink-50/50 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:py-32">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-bold tracking-wide text-orange-600 uppercase">
            <Sparkles className="h-4 w-4" />
            Flexible Pricing For Every Brand
          </div>
          <h1 className="mb-6 bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-5xl font-bold tracking-tight text-transparent lg:text-7xl">
            Scale Smarter, <span className="text-orange-500">Sell Faster</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-slate-600">
            Choose the plan that fits your growth stage. All paid plans include
            our entire library of conversion-optimized widgets and sections.
          </p>

          {/* Toggle */}
          <div className="mt-12 flex items-center justify-center gap-4">
            <span
              className={cn(
                "text-sm font-semibold transition-colors",
                billingCycle === "monthly" ? "text-slate-900" : "text-slate-400"
              )}
            >
              Monthly
            </span>
            <button
              onClick={() =>
                setBillingCycle(
                  billingCycle === "monthly" ? "yearly" : "monthly"
                )
              }
              className="relative h-8 w-16 rounded-full bg-slate-200 p-1 transition-colors hover:bg-slate-300"
            >
              <div
                className={cn(
                  "h-6 w-6 rounded-full bg-orange-500 shadow-sm transition-transform duration-300",
                  billingCycle === "yearly" ? "translate-x-8" : "translate-x-0"
                )}
              />
            </button>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-semibold transition-colors",
                  billingCycle === "yearly"
                    ? "text-slate-900"
                    : "text-slate-400"
                )}
              >
                Yearly
              </span>
              <span className="rounded bg-green-100 px-2 py-1 text-[10px] font-bold tracking-wider text-green-700 uppercase">
                Save {discount}%
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          {/* Free Plan */}
          <div className="group relative flex flex-col rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl lg:p-10">
            <div className="mb-8">
              <h3 className="mb-2 text-2xl font-bold">Free Plan</h3>
              <p className="text-sm text-slate-500">
                Perfect for beginners and testing.
              </p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tight">$0</span>
              <span className="font-medium text-slate-400">/forever</span>
            </div>

            <button className="mb-8 w-full rounded-2xl border-2 border-slate-200 px-6 py-4 font-bold transition-all hover:bg-slate-50">
              Get Started For Free
            </button>

            <div className="space-y-4">
              <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                What's included
              </p>
              {NEW_PRICING_FEATURES.free.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  {feature.included ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                  ) : (
                    <X className="mt-0.5 h-5 w-5 shrink-0 text-slate-200" />
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      feature.included
                        ? "text-slate-600"
                        : "text-slate-300 line-through"
                    )}
                  >
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Paid Plan */}
          <div className="group relative flex flex-col overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900 p-8 shadow-2xl transition-all duration-300 hover:-translate-y-1 lg:p-10">
            {/* Highlight Glow */}
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-orange-500/20 blur-[60px]" />

            <div className="absolute top-6 right-8">
              <span className="rounded-full bg-orange-500 px-4 py-1 text-[10px] font-bold tracking-widest text-white uppercase shadow-lg shadow-orange-500/20">
                Recommended
              </span>
            </div>

            <div className="mb-8">
              <h3 className="mb-2 flex items-center gap-2 text-2xl font-bold text-white">
                Pro Growth{" "}
                <Zap className="h-5 w-5 fill-orange-400 text-orange-400" />
              </h3>
              <p className="text-sm text-slate-400">
                The complete conversion toolkit.
              </p>
            </div>

            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tight text-white transition-all">
                {billingCycle === "monthly"
                  ? `$${monthlyPrice}`
                  : `$${Math.round(yearlyPrice / 12)}`}
              </span>
              <span className="font-medium text-slate-400">/month</span>
            </div>

            {billingCycle === "yearly" && (
              <p className="-mt-6 mb-4 text-sm font-bold text-orange-400">
                Billed yearly (${yearlyPrice}/yr)
              </p>
            )}

            <button className="mb-8 w-full rounded-2xl bg-orange-500 px-6 py-4 font-bold text-white transition-all hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.98]">
              Upgrade Now
            </button>

            <div className="space-y-4">
              <p className="mb-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                Everything in Free, plus:
              </p>
              {NEW_PRICING_FEATURES.paid.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  <span
                    className={cn(
                      "text-sm",
                      feature.highlight
                        ? "font-semibold text-white"
                        : "text-slate-300"
                    )}
                  >
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* trust section */}
        <div className="mt-24 text-center">
          <p className="mb-8 text-sm font-medium text-slate-400">
            TRUSTED BY 1,000+ HIGH-CONVERSION BRANDS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale transition-all duration-300 hover:grayscale-0">
            <div className="flex items-center gap-2 text-xl font-bold text-slate-600">
              <ShieldCheck className="h-6 w-6" /> Secured by Stripe
            </div>
            <div className="flex items-center gap-2 text-xl font-bold text-slate-600">
              <Globe className="h-6 w-6" /> Global Support
            </div>
            <div className="flex items-center gap-2 text-xl font-bold text-slate-600">
              <Check className="h-6 w-6" /> No Hidden Fees
            </div>
          </div>
        </div>

        {/* Detailed Comparison Table (Accordion Style) */}
        <div className="mx-auto mt-32 max-w-6xl px-4 lg:px-0">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold lg:text-5xl">
              Detailed Plan Comparison
            </h2>
            <p className="text-lg text-slate-500">
              Everything you need to grow from zero to hero.
            </p>
          </div>

          <div className="space-y-6">
            {/* Category: Customer Success & Support */}
            <ComparisonAccordion
              title="Customer Success & Support"
              subtitle="Get expert assistance and strategic guidance to optimize your store."
              isOpen={true}
            >
              <ComparisonRow
                name="Support Level"
                free="Help Support"
                pro="Developer Support"
                note="Help Support covers general usage; Developer Support includes technical customization and code-level assistance."
              />
              <ComparisonRow
                name="Ticket Support"
                free="Standard"
                pro="24/7 Priority"
                note="Priority tickets are handled by our senior team with a sub-2 hour response time guarantee."
              />
              <ComparisonRow
                name="Knowledge Base Access"
                free={true}
                pro={true}
                note="Full access to our extensive library of setup guides and troubleshooting videos."
              />
              <ComparisonRow
                name="Discord Community"
                free={false}
                pro={true}
                note="Join our private ecosystem of 1,000+ top-tier brand owners and developers."
              />
            </ComparisonAccordion>

            {/* Category: Essential Widgets */}
            <ComparisonAccordion
              title="Essential Widgets"
              subtitle="Foundational tools for every store start."
              isOpen={false}
            >
              <ComparisonRow
                name="Add To Cart Button"
                free={true}
                pro={true}
                note="Standard high-visibility add to cart button for all product pages."
              />
              <ComparisonRow
                name="Product Price & Container"
                free={true}
                pro={true}
                note="Fully responsive product detail containers with price formatting."
              />
              <ComparisonRow
                name="Rating Stars & Review Avatars"
                free={true}
                pro={true}
                note="Display customer social proof and star ratings natively."
              />
              <ComparisonRow
                name="Video & Text With Icon"
                free={true}
                pro={true}
                note="Enhanced media storytelling with native video and informational icons."
              />
              <ComparisonRow
                name="Badge & Column System"
                free={true}
                pro={true}
                note="Flexible layout grids and trust badges for your storefront."
              />
              <ComparisonRow
                name="Product Quantity Selector"
                free={true}
                pro={true}
                note="Allow customers to choose multiple items before checkout."
              />
            </ComparisonAccordion>

            {/* Category: Advanced Conversion */}
            <ComparisonAccordion
              title="Advanced Conversion & AOV"
              subtitle="Supercharge your revenue with high-impact sales tools."
            >
              <ComparisonRow
                name="Countdown Timer & Urgency"
                free={false}
                pro={true}
                note="Proven tool to increase conversion by creating genuine scarcity."
              />
              <ComparisonRow
                name="Product Bundle Offer"
                free={false}
                pro={true}
                note="Increase AOV by offering curated bundles right on the product page."
              />
              <ComparisonRow
                name="Product Sticky Add To Cart"
                free={false}
                pro={true}
                note="Keep the purchase button visible at all times on mobile and desktop scroll."
              />
              <ComparisonRow
                name="Product Upsell Block"
                free={false}
                pro={true}
                note="Intelligent cross-sell engine that recommends related products."
              />
              <ComparisonRow
                name="Product Sizing Chart"
                free={false}
                pro={true}
                note="Native sizing guide specifically designed for fashion and apparel."
              />
              <ComparisonRow
                name="Product Clickable Discount"
                free={false}
                pro={true}
                note="Allow users to apply discount codes with a single click."
              />
              <ComparisonRow
                name="Product Estimated Shipping"
                free={false}
                pro={true}
                note="Dynamic delivery estimates based on customer location."
              />
              <ComparisonRow
                name="Product Inventory & Subscription"
                free={false}
                pro={true}
                note="Show real-time stock levels and offer recurring subscription options."
              />
            </ComparisonAccordion>

            {/* Category: Store Sections */}
            <ComparisonAccordion
              title="Premium Sections"
              subtitle="Build stunning layouts with high-conversion components."
            >
              <ComparisonRow
                name="Advanced Mega Menu"
                free={false}
                pro={true}
                note="Sophisticated navigation for stores with extensive catalog structures."
              />
              <ComparisonRow
                name="Comparison Tables & Sliders"
                free={false}
                pro={true}
                note="Perfect for Us vs. Them comparisons or feature matrixes."
              />
              <ComparisonRow
                name="Shoppable Image & Parallax"
                free={false}
                pro={true}
                note="Immersive storytelling with hotspots and smooth parallax effects."
              />
              <ComparisonRow
                name="Instagram & TikTok Feeds"
                free={false}
                pro={true}
                note="Native social media integration to build brand trust instantly."
              />
              <ComparisonRow
                name="Track Order & Wishlist"
                free={false}
                pro={true}
                note="Advanced utility features for customer retention and follow-up."
              />
              <ComparisonRow
                name="Promotional Popups"
                free={false}
                pro={true}
                note="Capture emails and offer limited-time deals natively."
              />
              <ComparisonRow
                name="Horizontal & Vertical Tickers"
                free={false}
                pro={true}
                note="Dynamic scrolling text for announcements and social proof."
              />
              <ComparisonRow
                name="Custom Columns New (Dynamic)"
                free={false}
                pro={true}
                note="Highly flexible layout blocks for unique page content."
              />
            </ComparisonAccordion>

            {/* Category: Performance & Global */}
            <ComparisonAccordion
              title="Performance & Global Selling"
              subtitle="Scale your brand across borders with speed."
            >
              <ComparisonRow
                name="Mobile-First Core Architecture"
                free="Basic"
                pro="Premium"
                note="Pro tier includes advanced hydration and asset optimization for mobile."
              />
              <ComparisonRow
                name="Predictive Search"
                free={false}
                pro={true}
                note="Lightning-fast search results that suggest products as you type."
              />
              <ComparisonRow
                name="Multi-Currency Switcher"
                free={false}
                pro={true}
                note="Geo-targeted prices that update instantly to local currencies."
              />
              <ComparisonRow
                name="Built-in Advertorial Builders"
                free={false}
                pro={true}
                note="Native bridge-page templates for high-performance ad campaigns."
              />
              <ComparisonRow
                name="Priority VIP Support"
                free={false}
                pro={true}
                note="Direct channel to our core development team for any issue."
              />
            </ComparisonAccordion>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AccordionProps {
  title: string
  subtitle: string
  children: React.ReactNode
  isOpen?: boolean
}

function ComparisonAccordion({
  title,
  subtitle,
  children,
  isOpen: initialOpen = false,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(initialOpen)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 md:p-6"
      >
        <div>
          <h3 className="text-lg font-bold text-slate-900 md:text-xl">
            {title}
          </h3>
          <p className="mt-1 text-xs text-slate-500 md:text-sm">{subtitle}</p>
        </div>
        <div
          className={cn(
            "text-slate-400 transition-transform duration-300",
            isOpen ? "rotate-180" : "rotate-0"
          )}
        >
          <svg
            className="h-5 w-5 md:h-6 md:w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-100">
          <div className="hidden grid-cols-6 border-b border-slate-100 bg-slate-50 p-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase md:grid">
            <div className="col-span-4">Feature</div>
            <div className="text-center">Free</div>
            <div className="text-center">Pro</div>
          </div>
          <div className="divide-y divide-slate-100">{children}</div>
        </div>
      )}
    </div>
  )
}

function ComparisonRow({
  name,
  free,
  pro,
  note,
}: {
  name: string
  free: boolean | string
  pro: boolean | string
  note?: string
}) {
  const renderCell = (val: boolean | string, label?: string) => {
    return (
      <div className="flex flex-col items-center gap-1">
        {label && (
          <span className="text-[9px] font-bold tracking-tighter text-slate-400 uppercase md:hidden">
            {label}
          </span>
        )}
        {typeof val === "boolean" ? (
          val ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow-sm shadow-green-200 md:h-6 md:w-6">
              <Check className="h-3 w-3 stroke-3 text-white md:h-4 md:w-4" />
            </div>
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 text-red-500 md:h-6 md:w-6">
              <X className="h-3 w-3 stroke-3 md:h-4 md:w-4" />
            </div>
          )
        ) : (
          <span className="text-center text-xs font-medium text-slate-600 md:text-sm">
            {val}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 items-center gap-y-4 p-4 transition-colors hover:bg-slate-50/50 md:grid-cols-6 md:gap-y-0">
      <div className="group relative col-span-2 flex items-center gap-2 md:col-span-4">
        <span className="text-sm font-medium text-slate-600">{name}</span>
        <div className="group/tooltip relative cursor-help text-slate-300">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          {note && (
            <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-48 rounded-lg bg-slate-900 p-2 text-[10px] text-white opacity-0 shadow-xl transition-opacity group-hover/tooltip:opacity-100 md:left-1/2 md:-translate-x-1/2">
              {note}
              <div className="absolute top-full left-4 border-8 border-transparent border-t-slate-900 md:left-1/2 md:-translate-x-1/2" />
            </div>
          )}
        </div>
      </div>
      <div className="col-span-1 border-r border-slate-100 md:border-r-0">
        {renderCell(free, "Free")}
      </div>
      <div className="col-span-1">{renderCell(pro, "Pro")}</div>
    </div>
  )
}
