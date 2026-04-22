"use client"

import Link from "next/link"
import React, { useEffect, useRef, useState } from "react"
import { getActiveTemplates } from "@/actions/admin-templates"

interface Template {
  id?: string
  title: string
  description: string | null
  previewLink: string | null
  img: string | null
  bg: string | null
}

const ThemeBlockSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [previewLink, setPreviewLink] = useState(
    "https://zenvyaara.myshopify.com/"
  )

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

    const fetchTemplate = async () => {
      try {
        const templates = await getActiveTemplates()
        if (templates && templates.length > 0) {
          const firstTemplate = templates[0] as unknown as Template
          setPreviewLink(
            firstTemplate.previewLink || "https://zenvyaara.myshopify.com/"
          )
        }
      } catch (error) {
        console.error("Error fetching templates:", error)
      }
    }
    fetchTemplate()

    return () => observer.disconnect()
  }, [])

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#fff0ea] py-16 md:py-32"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 items-center gap-16 md:gap-20 lg:grid-cols-2 lg:gap-32">
          {/* Text Content - Appears second on mobile */}
          <div className="order-2 flex flex-col items-center text-center lg:order-1 lg:items-start lg:text-left">
            <h2 className="scroll-animate mb-8 font-heading text-4xl leading-tight md:text-[46px]">
              <span className="block">Power Up</span>
              <span className="block">Your Store with</span>
              <span className="block text-primary underline decoration-2 underline-offset-8">
                Shoptimity's Theme Block
              </span>
            </h2>

            <p className="scroll-animate transition-delay-100 mb-10 max-w-xl leading-relaxed text-gray-600 md:text-lg">
              With Shoptimity's new theme mechanism, you can use reusable theme
              blocks to create and update sections easily, keeping your store
              organized and ready to scale as you grow.
            </p>

            <div className="scroll-animate transition-delay-200 flex flex-col items-center gap-8 sm:flex-row">
              <button
                onClick={scrollToPricing}
                className="w-full cursor-pointer rounded-full bg-black px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl sm:w-auto"
              >
                Build with Shoptimity
              </button>
              <Link
                href="/setup"
                className="cursor-pointer text-lg font-bold text-primary underline-offset-4 hover:underline"
              >
                How to Setup?
              </Link>
            </div>
          </div>

          {/* Image Content - Appears first on mobile */}
          <div className="scroll-animate transition-delay-300 order-1 lg:order-2">
            <div className="relative">
              <Link
                href={previewLink}
                target="_blank"
                className="group absolute -bottom-12 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer lg:top-1/2 lg:bottom-auto lg:-left-12 lg:translate-x-0 lg:-translate-y-1/2"
              >
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-2xl transition-transform group-hover:scale-110">
                  <div className="animate-spin-slow absolute inset-0 flex items-center justify-center text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
                    <svg
                      viewBox="0 0 100 100"
                      className="h-full w-full fill-current"
                    >
                      <path
                        id="circlePath"
                        d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                        fill="transparent"
                      />
                      <text className="fill-gray-900 text-[13px] tracking-wide uppercase">
                        <textPath xlinkHref="#circlePath">
                          Explore the live theme now
                        </textPath>
                      </text>
                    </svg>
                  </div>
                  <div className="ml-1 h-0 w-0 border-t-10 border-b-10 border-l-16 border-t-transparent border-b-transparent border-l-primary"></div>
                </div>
              </Link>

              <div className="relative z-10 overflow-hidden rounded-3xl bg-white p-2 shadow-2xl">
                <img
                  src="/assets/shoptimity-theme-block-preview.webp"
                  alt="Shoptimity Theme Block Preview"
                  className="h-auto w-full rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ThemeBlockSection
