"use client"

import React, { useEffect, useState } from "react"
import { useBasePrice } from "@/hooks/use-base-price"

interface ComparisonStickyHeaderProps {
  competitorName: string
}

const ComparisonStickyHeader: React.FC<ComparisonStickyHeaderProps> = ({
  competitorName,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const { trialDays } = useBasePrice()

  useEffect(() => {
    const handleScroll = () => {
      // Show header after scrolling past 600px
      setIsVisible(window.scrollY > 600)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div
      className={`fixed top-0 left-0 z-50 w-full bg-white/90 py-4 shadow-md backdrop-blur-lg transition-all duration-500 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <img src="/shoptimity-icon.png" className="h-8 w-auto" alt="Logo" />
          <div className="hidden h-5 w-px bg-gray-200 sm:block"></div>
          <span className="text-sm font-bold text-gray-900 sm:text-lg">
            Shoptimity <span className="mx-1 text-gray-400">vs</span>{" "}
            {competitorName}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-xs font-bold tracking-widest text-gray-400 capitalize md:block">
            Simple Scaling
          </span>
          <button
            onClick={scrollToPricing}
            className="cursor-pointer rounded-full bg-orange-600 px-6 py-2.5 text-xs font-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:px-8 sm:text-sm"
          >
            VIEW PLANS
          </button>
        </div>
      </div>
    </div>
  )
}

export default ComparisonStickyHeader
