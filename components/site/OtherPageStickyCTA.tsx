"use client"

import { ArrowRight } from "lucide-react"
import React, { useState, useEffect } from "react"

const OtherPageStickyCTA: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false)

  useEffect(() => {
    const sectionStates = new Map<string, boolean>()

    const pricingSentinel = document.getElementById("pricing-section")
    const hero = document.getElementById("hero")
    const finalOffer = document.getElementById("final-offer")

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          sectionStates.set(entry.target.id, entry.isIntersecting)
        })

        const isAnyVisible = Array.from(sectionStates.values()).some(Boolean)
        setIsVisible(!isAnyVisible)
      },
      { threshold: 0.1 }
    )

    if (pricingSentinel) observer.observe(pricingSentinel)
    if (hero) observer.observe(hero)
    if (finalOffer) observer.observe(finalOffer)

    return () => {
      if (pricingSentinel) observer.unobserve(pricingSentinel)
      if (hero) observer.unobserve(hero)
      if (finalOffer) observer.unobserve(finalOffer)
      observer.disconnect()
    }
  }, [])

  const moveToPricing = () => {
    const pricingSection = document.getElementById("pricing")
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div
      className={`fixed right-8 bottom-8 left-8 z-40 transition-all duration-300 md:right-auto md:left-1/2 md:w-auto md:-translate-x-1/2 ${
        isVisible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-5 opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={moveToPricing}
          className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#FD784E_0%,#F06A42_60%,#D95734_100%)] px-4 py-6 text-base font-medium text-white shadow-[0_10px_25px_rgba(253,120,78,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(253,120,78,0.45)] active:scale-[0.98] md:min-w-[320px] md:px-10"
        >
          <span className="font-bold md:hidden">Get Shoptimity Now</span>
          <span className="hidden md:inline">
            UPGRADE TO THE SHOPTIMITY THEME NOW
          </span>
          <ArrowRight className="h-6 w-6 md:h-5 md:w-5" />
        </button>
      </div>
    </div>
  )
}

export default OtherPageStickyCTA
