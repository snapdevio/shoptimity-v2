"use client"

import { ArrowRight, Verified } from "lucide-react"
import ScrollObserver from "@/components/site/ScrollObserver"
import { DiscordIcon } from "@/components/site/BrandIcons"
import OtherPageStickyCTA from "@/components/site/OtherPageStickyCTA"
import dynamic from "next/dynamic"
import { useBasePrice } from "@/hooks/use-base-price"
import CTABadges from "@/components/site/CTABadges"
import { Toaster, toast } from "sonner"

const NewPricingSection = dynamic(
  () => import("@/components/site/NewPricingSection")
)

const WreathIcon = ({
  className,
  width = "20",
  height = "36",
}: {
  className?: string
  width?: string
  height?: string
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 800 1800"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M799.378 48.6769C757.61 152.404 674.339 233.942 569.715 273.568C570.068 166.851 686.515 51.54 799.378 48.6769ZM566.132 1614.3C488.025 1516.88 383.4 1459.24 304.929 1495.77C369.422 1624.32 500.56 1670.17 566.132 1614.3ZM443.946 1425.21C389.134 1317.79 298.482 1241.14 214.283 1261.2C251.903 1398 369.063 1467.12 443.946 1425.21ZM364.413 1219.67C332.166 1105.8 256.924 1012.69 172 1016.26C182.392 1156.64 282.712 1245.82 364.413 1219.67ZM328.583 1004.81C319.272 887.349 264.809 781.353 179.17 768.099C160.894 908.117 243.665 1015.55 327.146 1004.81H328.583ZM333.958 787.081C347.217 669.977 314.616 554.668 233.64 524.944C187.769 659.593 247.242 779.915 332.52 787.081H333.958ZM381.26 572.219C417.085 459.416 409.2 338.379 335.755 292.898C263.012 419.664 297.763 550.008 379.812 573.64L381.26 572.219ZM469.751 370.963C528.51 266.04 547.503 143.563 484.802 84.4702C386.983 196.205 393.795 332.277 469.751 370.963ZM520.985 400.329C597.665 440.438 696.191 403.193 762.835 328.705C700.852 270.687 580.817 296.475 520.985 401.044V400.329ZM436.061 592.268C519.188 616.619 608.049 561.833 656.419 478.029C583.681 432.559 472.969 478.396 436.061 592.268ZM391.285 794.236C477.276 801.761 553.586 731.213 584.052 641.324C503.778 610.891 405.252 677.496 391.285 794.236ZM386.978 1000.15C472.615 990.846 534.244 906.685 546.42 813.212C461.153 800.689 377.666 883.047 386.978 1000.15ZM422.807 1203.91C505.216 1177.77 549.284 1082.87 542.837 989.049C455.778 991.913 390.201 1090.04 422.807 1203.91ZM498.05 1398.36C573.646 1356.45 597.3 1255.12 572.933 1162.01C488.025 1181.71 442.519 1291.65 496.623 1398.36H498.05ZM613.064 1577.41C678.63 1521.19 679.708 1413.76 637.072 1326.74C557.523 1363.62 534.958 1481.08 611.637 1577.41H613.064ZM792.218 1770.43C572.004 1605.84 423.261 1363.19 376.61 1092.32C329.96 821.49 388.935 543.084 541.388 314.362C382.925 543.733 318.592 825.145 361.648 1100.55C404.716 1375.94 551.91 1624.32 772.849 1794.41C782.885 1802.29 795.06 1803.01 800.081 1794.41C805.101 1785.82 800.081 1776.51 791.482 1769L792.218 1770.43Z"
      fill="black"
    />
  </svg>
)

const problemSolutionData = [
  {
    problem: "Dropshipping Look",
    solutionTitle: "Fully Branded Design",
    solutionDesc:
      "Complete branding system with custom colors, fonts, and professional design elements modeled after 7 and 8-figure brands.",
  },
  {
    problem: "Expensive Monthly App Fees",
    solutionTitle: "All-In-One Solution",
    solutionDesc:
      "Get 100+ sections and blocks built-in. Eliminate 10+ monthly app subscriptions and save hundreds every month.",
  },
  {
    problem: "No Pre-Lander Support",
    solutionTitle: "Advertorials Inside Shopify",
    solutionDesc:
      "We're the first Shopify theme that lets you run professional pre-landers directly inside Shopify's native editor.",
  },
  {
    problem: "Generic Layouts",
    solutionTitle: "CVR Optimized Elements",
    solutionDesc:
      "Scientifically designed layouts and proven conversion techniques built from real-world data from successful stores.",
  },
  {
    problem: "Missing Cart Features",
    solutionTitle: "Advanced Cart System",
    solutionDesc:
      "Cart drawer with progress bar, product upsells, shipping protection, social proof banners, discount banners, and more.",
  },
  {
    problem: "No Community Or Support",
    solutionTitle: "Active Community & Updates",
    solutionDesc:
      "24/7 Discord support, real user feedback driving development, and continuous updates based on what the community needs.",
  },
]

const LandingPage = () => {
  const { trialDays } = useBasePrice()

  const handleCopy = () => {
    navigator.clipboard.writeText("SHOP5")
    toast.success("Coupon code SHOP5 copied to clipboard!")
  }

  const goToPricing = () => {
    const pricingSection = document.getElementById("pricing")
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="App bg-base-100 font-sans text-[#1A1A1A] antialiased selection:bg-primary/20">
      <ScrollObserver />
      <Toaster position="bottom-center" />

      <div id="pricing-section">
        <NewPricingSection />
      </div>
      {/* Hero Section */}
      <section
        id="hero"
        className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex flex-col items-center gap-12 text-center lg:flex-row lg:items-start lg:gap-16 lg:text-left">
            <div className="flex flex-1 flex-col items-center lg:items-start">
              {/* Wreath Section */}
              <div className="scroll-animate mb-6 flex items-center justify-center gap-4 lg:justify-start">
                <WreathIcon className="opacity-40" />
                <span className="text-[14px] font-normal text-muted-foreground md:text-[16px]">
                  Over{" "}
                  <span className="font-bold text-black opacity-100">
                    1,000 stores
                  </span>{" "}
                  are powered by
                  <img
                    src="/shoptimity-icon.png"
                    className="ml-2 inline-block h-5 w-auto"
                    alt="Shoptimity Icon"
                  />
                </span>
                <WreathIcon className="-scale-x-100 opacity-40" />
              </div>

              <h1 className="scroll-animate serif-heading mb-6 max-w-2xl text-[28px] leading-tight font-medium md:text-[42px] lg:text-6xl lg:leading-[1.1]">
                3 Reasons why Brand Owners are Upgrading Their Shopify Theme to{" "}
                <span className="text-gradient-orange-pink">Shoptimity</span>
              </h1>

              <p className="scroll-animate body-text max-w-2xl py-2.5 leading-relaxed text-base-content-muted md:mb-10">
                When 1,000+ successful store owners make the same choice,
                there&apos;s something worth exploring. Here&apos;s why this
                simple theme upgrade is transforming their stores.
              </p>

              {/* Mobile Phone Mockup Image (Visible only on mobile) */}
              <div className="scroll-animate relative mb-12 w-full lg:hidden">
                <img
                  src="/assets/shoptimity-mobile-mockups.webp?v=1"
                  className="mx-auto h-auto w-full max-w-sm drop-shadow-[0_50px_100px_rgba(0,0,0,0.15)]"
                  alt="Shoptimity Mockups"
                />
                <div className="absolute top-1/2 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[80px]"></div>
              </div>

              <div className="scroll-animate flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
                <div className="flex w-full flex-col items-center gap-3 sm:w-auto lg:items-start">
                  <button
                    onClick={goToPricing}
                    className="btn-orange group relative flex w-full max-w-md cursor-pointer items-center justify-center gap-2 px-4 py-6 text-[15px] font-bold shadow-[0_20px_40px_rgba(255,89,36,0.25)] transition-all hover:scale-105 active:scale-95 sm:w-auto md:gap-4 md:px-8 md:py-4.5"
                  >
                    <span className="md:hidden">GET STARTED FOR FREE</span>
                    <span className="hidden md:inline">
                      GET STARTED FOR FREE
                    </span>

                    <ArrowRight
                      size={22}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </button>
                  <CTABadges className="items-center justify-center lg:justify-start" />
                </div>

                <div className="flex items-center gap-2 text-[14px] font-medium opacity-60 md:text-[16px]">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
                  <span className="flex items-center gap-2 text-black">
                    <DiscordIcon size={16} className="text-black opacity-100" />
                    Over <span className="font-bold">2,600</span> active members
                    in our Discord
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Phone Mockup Image (Hidden on mobile) */}
            <div className="scroll-animate relative hidden w-full flex-1 lg:block lg:max-w-175">
              <div className="relative z-10">
                <img
                  src="/assets/shoptimity-mobile-mockups.webp?v=1"
                  className="h-auto w-full drop-shadow-[0_50px_100px_rgba(0,0,0,0.15)]"
                  alt="Shoptimity Mockups"
                />
              </div>

              {/* Decorative Glow */}
              <div className="absolute top-1/2 left-1/2 -z-10 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[150px]"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Reasoning Sections (1, 2, 3) */}
      <section className="bg-[#0A0A0A] py-10 text-white md:py-16">
        <div className="mx-auto max-w-7xl px-6">
          {/* Reason 1 */}
          <div className="flex flex-col gap-8 py-6 md:py-10 lg:flex-row lg:items-center lg:gap-24">
            {/* Mobile Header (Badge + Title) */}
            <div className="lg:hidden">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-white shadow-[0_0_30px_rgba(255,89,36,0.5)]">
                1
              </div>
              <h2 className="serif-heading mb-6 text-[32px] leading-tight font-bold">
                You can build a{" "}
                <span className="text-gradient-orange-pink">
                  premium, fully branded store
                </span>{" "}
                without hiring designers
              </h2>
            </div>

            <div className="scroll-animate flex-1">
              <img
                src="/assets/reason-one.webp"
                className="w-full drop-shadow-[0_20px_50px_rgba(255,89,36,0.15)]"
                alt="Reason 1 Visual"
              />
            </div>

            <div className="scroll-animate flex-1 text-left">
              <div className="hidden lg:block">
                <div className="mb-3.75 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-white shadow-[0_0_30px_rgba(255,89,36,0.5)]">
                  1
                </div>
                <h2 className="serif-heading mb-3.75 text-[28px] leading-tight font-bold">
                  You can build a{" "}
                  <span className="text-gradient-orange-pink">
                    premium, fully branded store
                  </span>{" "}
                  without hiring designers
                </h2>
              </div>
              <p className="body-text text-white/60">
                Shoptimity comes with everything you need to create a
                professional, branded store that stands out from generic
                dropshipping stores. You get{" "}
                <span className="font-bold text-white">
                  12+ industry-specific templates
                </span>
                , custom design systems, and professional advertorial templates
                that make your store look custom-built, and premium, without the
                thousands in design costs.
              </p>
            </div>
          </div>

          {/* Reason 2 */}
          <div className="flex flex-col gap-8 py-6 md:py-10 lg:flex-row-reverse lg:items-center lg:gap-24">
            {/* Mobile Header (Badge + Title) */}
            <div className="lg:hidden">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-white shadow-[0_0_30px_rgba(255,89,36,0.5)]">
                2
              </div>
              <h2 className="serif-heading mb-6 text-[32px] leading-tight font-bold tracking-[0.4px]">
                We give you design elements{" "}
                <span className="text-gradient-orange-pink">
                  used by 8-figure brands
                </span>
              </h2>
            </div>

            <div className="scroll-animate flex-1">
              <img
                src="/assets/reason-two.webp"
                className="w-full drop-shadow-[0_20px_50px_rgba(255,89,36,0.15)]"
                alt="Reason 2 Visual"
              />
            </div>

            <div className="scroll-animate flex-1 text-left">
              <div className="hidden lg:block">
                <div className="mb-3.75 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-white shadow-[0_0_30px_rgba(255,89,36,0.5)]">
                  2
                </div>
                <h2 className="serif-heading mb-3.75 text-[28px] leading-tight font-bold tracking-[0.4px]">
                  We give you design elements{" "}
                  <span className="text-gradient-orange-pink">
                    used by 8-figure brands
                  </span>
                </h2>
              </div>
              <p className="body-text mb-10 text-white/60">
                Beyond just looking professional, Shoptimity is packed with
                revenue-generating features that help you maximize every
                visitor. You get advanced quantity break options, an optimized
                custom cart with upsells, and 70+ product page blocks designed
                to increase conversions and turn single purchases into
                multiple-item orders.
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  "Advanced quantity breaks",
                  "Optimized custom cart",
                  "Professional advertorial pages",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-white/5 px-4 py-2 text-sm font-bold"
                  >
                    <Verified
                      size={16}
                      className="text-primary"
                      strokeWidth={2}
                    />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reason 3 */}
          <div className="flex flex-col gap-8 py-6 md:py-10 lg:flex-row lg:items-center lg:gap-24">
            {/* Mobile Header (Badge + Title) */}
            <div className="lg:hidden">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-white shadow-[0_0_30px_rgba(255,89,36,0.5)]">
                3
              </div>
              <h2 className="serif-heading mb-3.75 text-[32px] leading-tight font-bold">
                You get{" "}
                <span className="text-gradient-orange-pink">
                  12 free proven store templates
                </span>{" "}
                so you don&apos;t have to start from scratch
              </h2>
            </div>

            <div className="scroll-animate flex-1">
              <img
                src="/assets/shoptimity-mobile-mockups.webp"
                className="w-full drop-shadow-[0_20px_50px_rgba(255,89,36,0.15)]"
                alt="Reason 3 Visual"
              />
            </div>

            <div className="scroll-animate flex-1 text-left">
              <div className="hidden lg:block">
                <div className="mb-3.75 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-white shadow-[0_0_30px_rgba(255,89,36,0.5)]">
                  3
                </div>
                <h2 className="serif-heading mb-3.75 text-[28px] leading-tight font-bold">
                  You get{" "}
                  <span className="text-gradient-orange-pink">
                    12 free proven store templates
                  </span>{" "}
                  so you don&apos;t have to start from scratch
                </h2>
              </div>
              <p className="body-text text-white/60">
                You don&apos;t need to spend days building your store.
                Shoptimity gives you 12 free store templates modeled off of
                8-figure brands, so you can make the switch in just a single
                afternoon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Our Theme Section */}
      <section className="bg-white py-10 md:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-20 text-center">
            <div className="scroll-animate mb-6 inline-flex items-center gap-2 md:gap-4">
              <WreathIcon className="opacity-40" />
              <span className="text-sm font-black text-primary uppercase">
                Features
              </span>
              <WreathIcon className="-scale-x-100 opacity-40" />
            </div>
            <h2 className="scroll-animate serif-heading mb-3 text-4xl leading-tight font-bold text-black lg:text-6xl">
              Why Choose Our Theme?
            </h2>
            <p className="scroll-animate text-black/50 md:text-lg">
              Everything you need to build a high-converting Shopify store
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-10">
            {/* Card 1: Fully Branded */}
            <div className="group relative col-span-2 aspect-4/3 overflow-hidden rounded-[24px] bg-[#0A0A0A] transition-all duration-500 hover:shadow-2xl md:col-span-2 md:aspect-auto md:h-125">
              <div className="absolute inset-0 z-0">
                <img
                  src="/assets/fully-branded.webp"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt="Fully Branded"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/90 via-black/40 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 z-10 w-full p-3 md:p-10">
                <h3 className="mb-2 text-[16px] font-bold text-white md:mb-3 md:text-[24px]">
                  Fully Branded
                </h3>
                <p className="max-w-2xl text-[13px] leading-relaxed text-white/70 md:text-lg md:text-[14px]">
                  Complete branding system with custom colors, fonts, and
                  professional design elements that make your store stand out.
                </p>
              </div>
            </div>

            {/* Card 2: CVR Optimized */}
            <div className="group relative col-span-1 aspect-3/4 overflow-hidden rounded-[24px] bg-[#0A0A0A] transition-all duration-500 hover:shadow-2xl md:col-span-1 md:aspect-auto">
              <div className="absolute inset-0 z-0">
                <img
                  src="/assets/cvr-optimized.webp"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt="CVR Optimized"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/90 via-black/40 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 z-10 w-full p-3 md:p-8">
                <h3 className="mb-1 text-[16px] font-bold text-white md:mb-2 md:text-[24px]">
                  CVR Optimized
                </h3>
                <p className="text-[13px] leading-tight text-white/70 md:text-base md:leading-relaxed">
                  Scientifically designed layouts and proven conversion
                  techniques.
                </p>
              </div>
            </div>

            {/* Card 3: Quantity Breaks */}
            <div className="group relative col-span-1 aspect-3/4 overflow-hidden rounded-[24px] bg-[#0A0A0A] transition-all duration-500 hover:shadow-2xl md:col-span-1 md:aspect-auto">
              <div className="absolute inset-0 z-0">
                <img
                  src="/assets/quantity-breaks.webp"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt="Quantity Breaks"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/90 via-black/40 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 z-10 w-full p-3 md:p-8">
                <h3 className="mb-1 text-[16px] font-bold text-white md:mb-2 md:text-2xl md:text-[24px]">
                  Quantity Breaks
                </h3>
                <p className="text-[13px] leading-tight text-white/70 md:text-base md:leading-relaxed">
                  Smart pricing tiers that increase order values and boost
                  revenue.
                </p>
              </div>
            </div>

            {/* Card 4: Advanced Cart */}
            <div className="group relative col-span-2 aspect-4/3 overflow-hidden rounded-[24px] bg-[#0A0A0A] transition-all duration-500 hover:shadow-2xl md:col-span-2 md:aspect-auto md:h-125">
              <div className="absolute inset-0 z-0">
                <img
                  src="/assets/advanced-cart.webp"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt="Advanced Cart"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/90 via-black/40 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 z-10 w-full p-3 md:p-10">
                <h3 className="mb-2 text-[16px] font-bold text-white md:mb-3 md:text-3xl md:text-[24px]">
                  Advanced Cart
                </h3>
                <p className="max-w-xl text-[13px] leading-relaxed text-white/70 md:text-lg">
                  Cart drawer with a progress bar, banners, and more.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Universal Layout Showcase Section */}
      <section className="overflow-hidden bg-base-100 py-10 md:py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="scroll-animate serif-heading text-[32px] font-bold text-black md:text-[54px] md:leading-16">
            Universal layout built for conversions
          </h2>
        </div>

        <div className="relative w-full">
          <div className="group flex overflow-hidden">
            <div className="animate-row-left flex whitespace-nowrap">
              <img
                src="/assets/universal-layout.webp"
                className="h-100 w-auto max-w-none md:h-150"
                alt="Store Layouts Showcase"
              />
              <img
                src="/assets/universal-layout.webp"
                className="h-100 w-auto max-w-none md:h-150"
                alt="Store Layouts Showcase"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-linear-to-r from-base-100 to-transparent"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-linear-to-l from-base-100 to-transparent"></div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="relative overflow-hidden bg-white py-14 md:py-24">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -z-10 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-50/25 blur-[130px]"></div>
        <div className="absolute top-0 right-0 -z-10 h-96 w-96 bg-blue-50/20 blur-[100px]"></div>

        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <div className="scroll-animate mb-6 flex items-center justify-center gap-4">
              <WreathIcon className="opacity-40" />
              <span className="text-[14px] font-black text-primary uppercase">
                How it works
              </span>
              <WreathIcon className="-scale-x-100 opacity-40" />
            </div>
            <h2 className="scroll-animate serif-heading mb-4 text-4xl font-bold text-black md:text-[54px] md:leading-[1.1]">
              Your Problem,{" "}
              <span className="text-gradient-orange-pink">Our Solution</span>
            </h2>
            <p className="scroll-animate mx-auto max-w-2xl text-black/50 md:text-[18px]">
              Common problems store owners face — and exactly how we solve them.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {problemSolutionData.map((item, index) => (
              <div
                key={index}
                className="scroll-animate group relative flex flex-col overflow-hidden rounded-[24px] border border-black/8 bg-white transition-all duration-500 hover:border-primary/20 hover:shadow-2xl"
              >
                {/* Problem Section */}
                <div className="relative flex-1 p-6.5">
                  {/* Red Blur */}
                  <div className="absolute -top-12 -right-12 z-0 h-40 w-40 rounded-full bg-red-500/5 blur-3xl transition-opacity group-hover:opacity-100"></div>

                  <div className="relative z-10">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[12px] font-bold text-red-500">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                      Your Problem
                    </div>
                    <h3 className="text-[20px] font-bold tracking-tight text-black">
                      {item.problem}
                    </h3>
                  </div>
                </div>

                {/* Dashboard Separator (Dashed) */}
                <div className="px-6.5">
                  <div className="h-px w-full border-t border-dashed border-black/12"></div>
                </div>

                {/* Solution Section */}
                <div className="relative flex-1 p-6.5">
                  {/* Green Blur */}
                  <div className="absolute -bottom-12 -left-12 z-0 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl transition-opacity group-hover:opacity-100"></div>

                  <div className="relative z-10">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-600">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600"></div>
                      Our Solution
                    </div>
                    <h4 className="mb-3 text-[18px] font-bold tracking-tight text-black">
                      {item.solutionTitle}
                    </h4>
                    <p className="text-[14px] leading-relaxed font-medium text-black/60">
                      {item.solutionDesc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Final Offer / Transformation Section */}
      <section id="final-offer" className="bg-base-100 px-6 py-10 md:py-16">
        <div className="scroll-animate relative mx-auto max-w-7xl overflow-hidden rounded-[40px] bg-white p-5 shadow-2xl md:p-16 lg:p-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[40px_40px] opacity-[0.03]"></div>

          <div className="relative z-10 grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col">
              <div className="mb-3 inline-flex items-center gap-3 text-[14px] md:mb-8">
                <WreathIcon className="opacity-60" width="18" height="32" />
                <p className="font-bold text-black/60 uppercase">
                  Join <span className="font-black text-black">1,000 +</span>{" "}
                  Stores
                </p>
                <WreathIcon
                  className="-scale-x-100 opacity-60"
                  width="18"
                  height="32"
                />
              </div>

              <h2 className="serif-heading mb-4 max-w-md text-[36px] leading-[1.1] font-bold text-black md:text-[54px]">
                Ready to transform your{" "}
                <span className="text-gradient-orange-pink">
                  store into a brand?
                </span>
              </h2>

              <p className="max-w-auto mb-3 font-medium text-black/50">
                Purchase today and receive our template collection at no extra
                cost.
              </p>

              <div className="mb-3 flex flex-wrap gap-3">
                {[
                  "Fashion Template",
                  "Supplement Template",
                  "Kitchen Template",
                  "Toy Template",
                  "Skincare Template",
                  "Cake Template",
                  "Bag Template",
                  "Pet Template",
                  "Beauty Template",
                  "Glassware Template",
                  "Speaker Template",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/5 px-3 py-1.5 text-[12px] font-bold tracking-wide text-black/60 ring-1 ring-black/10 md:px-5 md:py-2 md:text-[13px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mb-4 text-[13px] font-bold text-black/40 italic md:mb-8">
                *Offer active as of{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>

              <div className="flex flex-col items-center gap-3 lg:items-start">
                <button
                  onClick={goToPricing}
                  className="group relative flex max-w-md cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-linear-to-r from-primary to-[#FF8C66] px-6 py-3 text-[15px] font-black text-white shadow-[0_20px_40px_rgba(255,89,36,0.25)] transition-all hover:scale-105 active:scale-95 sm:w-auto md:gap-4 md:px-7 md:py-4.5"
                >
                  GET STARTED FOR FREE
                  <ArrowRight
                    size={20}
                    className="transition-transform group-hover:translate-x-1"
                  />
                  <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity"></div>
                </button>
                <CTABadges className="items-center justify-center lg:justify-start" />
              </div>
            </div>

            <div className="relative">
              <img
                src="/assets/ready-to-transform.webp"
                className="w-full rounded-[32px] object-cover shadow-2xl"
                alt="Template Collection"
              />
              <div className="absolute -inset-10 -z-10 bg-[#FF5D2B]/10 blur-[100px]"></div>
            </div>
          </div>
        </div>
      </section>

      <OtherPageStickyCTA />
    </div>
  )
}

export default LandingPage
