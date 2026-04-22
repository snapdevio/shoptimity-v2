"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useBasePrice } from "@/hooks/use-base-price"

interface MobileStickyCTAProps {
  price?: string
}

const MobileStickyCTA: React.FC<MobileStickyCTAProps> = ({ price }) => {
  const { basePrice, trialDays } = useBasePrice()
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const router = useRouter()
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(false)
          } else {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1 }
    )
    const home = document.getElementById("home")
    const footer = document.querySelector("footer")
    const pricing = document.getElementById("pricing")

    if (footer) observer.observe(footer)
    if (pricing) observer.observe(pricing)
    if (home) observer.observe(home)

    return () => {
      if (footer) observer.unobserve(footer)
      if (pricing) observer.unobserve(pricing)
      if (home) observer.unobserve(home)
    }
  }, [])

  const scrollToPricing = () => {
    router.push(`/plans`)
  }

  return (
    <div
      className={`fixed right-8 bottom-8 left-8 z-40 transition-all duration-300 md:hidden ${
        isVisible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-5 opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={scrollToPricing}
          className=":scale-[0.98] flex h-[56px] w-full cursor-pointer items-center justify-center rounded-full bg-[linear-gradient(135deg,#FD784E_0%,#F06A42_60%,#D95734_100%)] font-sans text-base font-normal text-white shadow-[0_10px_25px_rgba(253,120,78,0.35)] transition duration-300 hover:-translate-y-[2px] hover:shadow-[0_14px_30px_rgba(253,120,78,0.45)]"
        >
          {trialDays > 0 ? (
            "Start Free Trial Now"
          ) : (
            <>
              Get Shoptimity @{" "}
              <span className="ml-1">{price || basePrice}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default MobileStickyCTA
