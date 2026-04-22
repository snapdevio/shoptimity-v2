"use client"

import React, { useEffect, useRef } from "react"
import { useBasePrice } from "@/hooks/use-base-price"
import CTABadges from "./CTABadges"

const MobileFirstSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { basePrice, trialDays } = useBasePrice()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active")
          }
        })
      },
      { threshold: 0.1 }
    )

    const elements = sectionRef.current?.querySelectorAll(".scroll-animate")
    elements?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  const features = [
    { title: "Mobile Search", img: "/assets/mobile-search-filter.webp" },
    { title: "Mobile Filter", img: "/assets/mobile-sort-filter.webp" },
    { title: "Mobile Menu", img: "/assets/mobile-menu-filter.webp" },
    { title: "Mobile Product Tabs", img: "/assets/mobile-product-tabs.webp" },
  ]

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden bg-white py-10 md:py-24"
    >
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-10 max-w-3xl text-center md:mb-20">
          <h2 className="scroll-animate mb-3 font-heading text-[38px] md:mb-6 md:text-5xl">
            Shoptimity is a{" "}
            <span className="text-gradient-orange-pink">
              Mobile-first theme
            </span>
          </h2>
          <p className="scroll-animate transition-delay-100 text-gray-500 md:text-lg">
            Built with M-commerce success in mind, Shoptimity takes excellent
            care of your mobile experience.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-4">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`scroll-animate text-center transition-delay-${(i + 1) * 100}`}
            >
              <div className="group relative mx-auto mb-6 aspect-2/4 max-w-[280px] cursor-pointer overflow-hidden rounded-[2rem] border border-gray-200 bg-white p-1 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                <div className="h-full w-full overflow-hidden rounded-[1.8rem] border border-gray-100">
                  <img
                    src={feature.img}
                    alt={feature.title}
                    className="h-full w-full object-cover object-top transition-transform duration-700"
                  />
                </div>
                {/* Overlay for better visibility of "feature" */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {feature.title}
              </h3>
            </div>
          ))}
        </div>

        <div className="scroll-animate mt-10 text-center md:mt-20">
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={scrollToPricing}
              className="btn-orange cursor-pointer rounded-full px-10 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              {trialDays > 0 ? (
                "Start Free Trial Now"
              ) : (
                <>
                  Get Shoptimity @{" "}
                  <span className="ml-[2px] text-primary">{basePrice}</span>
                </>
              )}
            </button>
            <CTABadges
              trialDays={trialDays}
              className="items-center justify-center"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default MobileFirstSection
