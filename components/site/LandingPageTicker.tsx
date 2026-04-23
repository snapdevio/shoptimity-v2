"use client"

import React from "react"

const LandingPageTicker: React.FC = () => {
  const baseItems = ["Try Shoptimity Free Now", "No Hidden Charges"]
  const items = Array(8).fill(baseItems).flat()

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="group overflow-hidden border-y border-orange-600/20 bg-[#FF602E] py-4">
      <div className="flex whitespace-nowrap">
        <div
          className="animate-row-left flex items-center gap-12 group-hover:paused"
          style={{ animationDuration: "100s" }}
        >
          {items.map((text, i) => (
            <div
              key={i}
              onClick={scrollToPricing}
              className="flex cursor-pointer items-center gap-4"
            >
              <span className="font-heading text-xl font-bold tracking-widest text-white md:text-2xl">
                {text}
              </span>
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {items.map((text, i) => (
            <div
              key={`dup-${i}`}
              onClick={scrollToPricing}
              className="flex cursor-pointer items-center gap-4"
            >
              <span className="font-heading text-xl font-bold tracking-widest text-white md:text-2xl">
                {text}
              </span>
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LandingPageTicker
