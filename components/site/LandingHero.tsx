"use client"

import { Check } from "lucide-react"
import React, { useEffect, useRef, useState } from "react"
import { useBasePrice } from "@/hooks/use-base-price"
import { getActiveTemplates } from "@/actions/admin-templates"
import CTABadges from "./CTABadges"

const LandingHero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null)
  const [demos, setDemos] = useState<any[]>([])
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

    const elements = heroRef.current?.querySelectorAll(".scroll-animate")
    elements?.forEach((el) => observer.observe(el))

    const fetchDemos = async () => {
      try {
        const templates = await getActiveTemplates()
        setDemos(templates)
      } catch (error) {
        console.error("Failed to fetch templates:", error)
      }
    }
    fetchDemos()

    return () => observer.disconnect()
  }, [])

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
  }

  const column1 = [
    "/assets/panora-home-web.webp",
    "/assets/templates/4.webp",
    "/assets/templates/3.webp",
    "/assets/templates/1.webp",
    "/assets/templates/2.webp",
    "/assets/templates/5.webp",
    "/assets/zenvyra-web.webp",
  ]

  const column2 = [
    "/assets/aqua-space-web.webp",
    "/assets/audify-web.webp",
    "/assets/bag-web.webp",
    "/assets/creamelle-web.webp",
    "/assets/zenvyra-web.webp",
    "/assets/glassie-web.webp",
  ]

  const scrollToNicheTemplates = () => {
    document.getElementById("demos")?.scrollIntoView({ behavior: "smooth" })
  }

  const repeatItems = (items: any[], min: number) => {
    if (items.length === 0) return []
    let result = [...items]
    while (result.length < min) {
      result = [...result, ...items]
    }
    return result
  }

  const col1Items = repeatItems(
    [...demos.slice(0, Math.ceil(demos.length / 2)), ...column1],
    12
  )

  const col2Items = repeatItems(
    [...demos.slice(Math.ceil(demos.length / 2)), ...column2],
    12
  )

  return (
    <section
      ref={heroRef}
      className="relative mx-auto overflow-hidden bg-white pt-0 pb-0"
      id="home"
    >
      <div className="relative z-10 container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-4 md:gap-12 lg:grid-cols-2">
          <div className="py-8 text-center lg:py-24 lg:text-left">
            <h1 className="scroll-animate mb-8 font-heading text-[32px] leading-tight text-gray-900 md:text-[38px] lg:text-5xl">
              <span className="block">Build a High-Converting</span>
              <span className="block">
                Shopify Store{" "}
                <span className="text-primary underline decoration-2 underline-offset-8 md:decoration-4 md:underline-offset-12">
                  Without
                </span>
              </span>
              <span className="block">
                <span className="text-primary underline decoration-2 underline-offset-8 md:decoration-4 md:underline-offset-12">
                  Paying for 10+ Apps
                </span>
              </span>
            </h1>

            <p className="scroll-animate transition-delay-100 mx-auto mb-10 max-w-xl px-3 leading-relaxed text-gray-500 md:px-0 md:text-lg lg:mx-0 lg:max-w-none">
              Achieve A Clean & Modern Website Design Effortlessly - Where
              Interactive Creativity Meets Seamless UX.
            </p>

            <div className="scroll-animate transition-delay-200 mb-10 flex flex-col items-center space-y-4 font-bold text-gray-900 lg:items-start">
              {[
                "Absolute responsiveness",
                "Lightning-fast speed",
                "SEO-friendly by default",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div className="scroll-animate flex flex-col items-center justify-center gap-4 px-3 sm:flex-row sm:items-start md:px-0 lg:justify-start">
              <div className="flex w-full flex-col items-center gap-3 sm:w-auto lg:items-start">
                <button
                  onClick={scrollToPricing}
                  className="btn-orange flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-8 py-4 font-sans text-lg sm:w-auto"
                >
                  Get Started For Free
                </button>
                <CTABadges className="items-center justify-center lg:justify-start" />
              </div>

              <button
                className="flex cursor-pointer items-center gap-2 py-4 font-sans text-lg transition-colors hover:text-orange-600"
                onClick={scrollToNicheTemplates}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary">
                  <svg
                    className="h-5 w-5 fill-current text-primary-content"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                View Live Demo
              </button>
            </div>
          </div>

          {/* Scrolling Showcase */}
          <div className="group relative h-[350px] overflow-hidden lg:h-[800px]">
            {/* Desktop: Vertical Columns */}
            <div className="hidden h-full grid-cols-2 gap-4 lg:grid">
              <div className="animate-vertical-loop-slow space-y-4">
                {col1Items.map((item, i) => (
                  <div
                    key={`col1-${i}`}
                    className="overflow-hidden rounded-2xl border border-gray-100 shadow-lg"
                  >
                    <img
                      src={
                        typeof item === "string"
                          ? item
                          : item.img || "/assets/placeholder-web.webp"
                      }
                      alt="Theme Preview"
                      className="h-auto w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="animate-vertical-loop-slow-reverse space-y-4">
                {col2Items.map((item, i) => (
                  <div
                    key={`col2-${i}`}
                    className="overflow-hidden rounded-2xl border border-gray-100 shadow-lg"
                  >
                    <img
                      src={
                        typeof item === "string"
                          ? item
                          : item.img || "/assets/placeholder-web.webp"
                      }
                      alt="Theme Preview"
                      className="h-auto w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: Horizontal Row */}
            <div className="flex h-full items-center py-6 lg:hidden">
              <div className="marquee gap-6 px-4">
                {repeatItems([...demos, ...column1, ...column2], 12).map(
                  (item, i) => (
                    <div
                      key={`mob-${i}`}
                      className="h-[280px] w-[340px] flex-none overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl"
                    >
                      <img
                        src={
                          typeof item === "string"
                            ? item
                            : item.img || "/assets/placeholder-web.webp"
                        }
                        alt="Theme Preview"
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Gradient Overlays */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-linear-to-b from-white to-transparent"></div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-white to-transparent"></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LandingHero
