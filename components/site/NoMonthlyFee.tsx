"use client"

import React, { useState, useRef } from "react"
import { useBasePrice } from "@/hooks/use-base-price"
import CTABadges from "./CTABadges"

import {
  MonitorPlay,
  SlidersHorizontal,
  Truck,
  Clock,
  Ruler,
  Camera,
  Video,
  Image as ImageIcon,
  ShoppingCart,
  Zap,
  Replace,
  MessagesSquare,
  Bell,
  FileText,
  Palette,
  History,
  Infinity,
  Target,
  Search,
  Users,
  Layers,
  Eye,
  Heart,
  ShoppingBag,
  LucideIcon,
} from "lucide-react"

interface Feature {
  icon: LucideIcon
  name: string
  price: string
}

interface NoMonthlyFeeProps {
  headline?: string
  subheadline?: string
}

const NoMonthlyFee: React.FC<NoMonthlyFeeProps> = ({
  headline,
  subheadline,
}) => {
  const [showAll, setShowAll] = useState<boolean>(false)
  const { basePrice, trialDays } = useBasePrice()
  const sectionRef = useRef<HTMLElement>(null)

  const features: Feature[] = [
    { icon: MonitorPlay, name: "Slideshow", price: "$150/Year" },
    { icon: SlidersHorizontal, name: "Advanced Filters", price: "$240/Year" },
    { icon: Truck, name: "Free Shipping Bar", price: "$144/Year" },
    { icon: Clock, name: "Countdown Timer", price: "$84/Year" },
    { icon: Ruler, name: "Size Chart", price: "$69/Year" },
    { icon: Camera, name: "Instagram Shop", price: "$50/Year" },
    { icon: Video, name: "Tiktok Shop", price: "$60/Year" },
    { icon: ImageIcon, name: "Lookbook", price: "$290/Year" },
    { icon: ShoppingCart, name: "Sticky Add to Cart", price: "$150/Year" },
    { icon: Zap, name: "Stock Countdown", price: "$36/Year" },
    { icon: Replace, name: "Image Comparison", price: "$72/Year" },
    { icon: MessagesSquare, name: "Live Chat", price: "$228/Year" },
    { icon: Bell, name: "Sales Notifications", price: "$60/Year" },
    { icon: FileText, name: "Custom Fields", price: "$109/Year" },
    { icon: Palette, name: "Compare Color", price: "$55/Year" },
    { icon: History, name: "Recently Viewed", price: "$36/Year" },
    { icon: Infinity, name: "Infinite Scroll", price: "$120/Year" },
    { icon: Target, name: "Cart Goals", price: "$155/Year" },
    { icon: Search, name: "Smart Search Bar", price: "$60/Year" },
    { icon: Users, name: "Real Time Visitor", price: "$84/Year" },
    { icon: Layers, name: "Compare Product", price: "$60/Year" },
    { icon: Eye, name: "Quick View", price: "$78/Year" },
    { icon: Heart, name: "Wish Lists", price: "$96/Year" },
    { icon: ShoppingBag, name: "Bought Together", price: "$240/Year" },
  ]

  const initialFeatures = features.slice(0, 12)
  const extraFeatures = features.slice(12)

  const handleToggle = () => {
    if (showAll) {
      sectionRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    setShowAll(!showAll)
  }

  const FeatureCard: React.FC<{ feature: Feature }> = ({ feature }) => (
    <div className="group flex flex-col items-center rounded-2xl border bg-base-100 p-6 text-center font-sans transition-all duration-300 hover:-translate-y-1 hover:bg-base-300 hover:shadow-lg">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border text-primary transition-all group-hover:bg-primary group-hover:text-primary-content">
        <feature.icon className="h-6 w-6" />
      </div>
      <h4 className="mb-1 text-[15px] font-medium text-base-content">
        {feature.name}
      </h4>
      <p className="text-xs text-base-content-muted">{feature.price}</p>
    </div>
  )

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-base-100 px-4 pt-0 pb-16 sm:px-6 md:py-24"
    >
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[220px] w-full -translate-x-1/2 bg-[radial-gradient(50%_50%_at_50%_100%,rgba(255,89,36,0.1)_0%,rgba(255,89,36,0)_100%)] md:h-[300px]"></div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="scroll-animate mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-gray-300 px-4 py-1.5 font-sans text-[10px] font-bold tracking-widest uppercase">
            ONE-TIME PURCHASE
          </span>
          <h2 className="mb-6 font-heading text-4xl text-base-content md:text-6xl">
            {headline || (
              <>
                Cut Monthly Costs{" "}
                <span className="text-gradient-orange-pink">Forever</span>
              </>
            )}
          </h2>
          <p className="mx-auto max-w-2xl font-sans leading-relaxed text-base-content-muted">
            {subheadline ||
              "A one-time investment unlocks everything you need. Save $2,400+ annually with premium built-in features—no third-party apps needed."}
          </p>
        </div>

        <div className="rounded-[40px] border bg-base-300 p-6 shadow-sm md:p-12">
          <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="flex h-full flex-col items-center justify-between py-4 text-center font-sans lg:col-span-4 lg:items-start lg:text-left">
              <div className="scroll-animate flex flex-col items-center lg:items-start">
                <span className="mb-2 block text-lg text-base-content-muted opacity-60">
                  Save
                </span>
                <div className="flex items-start justify-center lg:justify-start">
                  <span className="mt-4 mr-1 text-2xl text-primary">$</span>
                  <span className="text-7xl font-bold tracking-tight text-primary md:text-8xl">
                    2.4k
                  </span>
                </div>
                <span className="mt-2 block text-xl text-base-content-muted">
                  / Per Year
                </span>
                <p className="mt-6 text-sm text-base-content-muted/80">
                  Reduce costs with everything you need already included.
                </p>
              </div>

              <div className="scroll-animate mt-12 flex w-full flex-col items-center gap-3 lg:mt-auto lg:items-start">
                <button
                  onClick={() =>
                    document
                      .getElementById("pricing")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="text-md group flex w-[240px] cursor-pointer items-center justify-center rounded-full bg-primary px-6 py-4 font-sans font-bold text-primary-content shadow-lg shadow-orange-500/20 transition-all duration-300 hover:-translate-y-1 lg:w-full"
                >
                  {trialDays > 0
                    ? "Start Free Trial Now"
                    : `Get Shoptimity @ ${basePrice}`}
                </button>
                <CTABadges
                  trialDays={trialDays}
                  className="w-full items-center justify-center"
                />
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="scroll-animate grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {initialFeatures.map((feature, idx) => (
                  <FeatureCard key={idx} feature={feature} />
                ))}
              </div>

              <div
                className={`overflow-hidden transition-all duration-700 ease-in-out ${
                  showAll
                    ? "max-h-[2000px] pt-4 opacity-100"
                    : "pointer-events-none max-h-0 opacity-0"
                }`}
              >
                <div className="scroll-animate grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {extraFeatures.map((feature, idx) => (
                    <FeatureCard key={idx} feature={feature} />
                  ))}
                </div>
              </div>

              <div className="scroll-animate mt-8 text-center">
                <button
                  onClick={handleToggle}
                  className="cursor-pointer rounded-xl border px-8 py-3 font-sans text-sm text-base-content-muted/80 transition-all hover:bg-base-100"
                >
                  {showAll ? "View Less" : "View More"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default NoMonthlyFee
