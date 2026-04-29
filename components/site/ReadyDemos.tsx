"use client"

import React, { useState, useEffect } from "react"
import { getActiveTemplates } from "@/actions/admin-templates"
import CTABadges from "./CTABadges"

interface DemoItem {
  id?: string
  title: string
  description: string | null
  previewLink: string | null
  img: string | null
  bg: string | null
  alt?: string
}

interface ReadyDemosProps {
  // initialDemos removed as we fetch directly
}

const DemoCard: React.FC<DemoItem> = ({
  title,
  description,
  previewLink,
  img,
  bg,
  alt,
}) => (
  <div
    className={`scroll-animate ${bg} flex flex-col items-center rounded-[20px] px-6 pt-10 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:px-10`}
  >
    <h3 className="scroll-animate mb-2 font-heading text-[32px] leading-tight font-medium">
      {title}
    </h3>
    <p className="scroll-animate mb-6 max-w-xs font-sans text-base-content-muted">
      {description}
    </p>
    <a
      href={previewLink || "#"}
      className="mb-8 flex items-center gap-2 font-sans font-semibold transition-all hover:gap-3 hover:text-orange-600"
      target="_blank"
    >
      View Demo Store
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 8l4 4m0 0l-4 4m4-4H3"
        />
      </svg>
    </a>
    <div className="scroll-animate mt-auto aspect-video w-full max-w-[495px] overflow-hidden rounded-t-[10px]">
      <img
        src={img || "/assets/placeholder-web.webp"}
        className="h-full w-full object-cover"
        alt={alt || title}
      />
    </div>
  </div>
)

const ReadyDemos: React.FC<ReadyDemosProps> = () => {
  const [demos, setDemos] = useState<DemoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const templatesData = await getActiveTemplates()
        setDemos(templatesData as DemoItem[])
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <>
      <section
        className="scroll-animate bg-white pt-[100px] pb-[60px] text-center font-sans"
        id="demos"
      >
        <div className="relative flex flex-col items-center justify-center pt-[125px]">
          <span className="absolute top-[-15px] z-0 flex h-[196px] w-[350px] items-center justify-center bg-linear-to-b from-[#FFA876] to-[#FFFFFF] bg-clip-text text-[288px] leading-none font-bold text-transparent opacity-80 select-none">
            {loading ? "" : demos.length}
          </span>

          <h2 className="scroll-animate relative z-10 font-heading text-[32px] font-medium tracking-tight md:text-6xl">
            <span className="bg-linear-to-r from-orange-500 via-pink-400 to-pink-300 bg-clip-text text-transparent">
              Ready-To-Use
            </span>
            <span className="text-slate-900"> Complete Demos</span>
          </h2>

          <p className="scroll-animate mx-auto mt-6 max-w-sm font-sans leading-snug text-gray-600 md:max-w-md">
            Pre-designed store layouts that help you scale and maximize your
            retail potential effortlessly.
          </p>
        </div>
      </section>

      <section className="bg-base-300 px-4 pb-14 sm:px-6 md:pb-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">
          {loading ? (
            <div className="col-span-full flex min-h-[400px] items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <>
              {demos.map((demo) => (
                <DemoCard key={demo.id || demo.title} {...demo} />
              ))}
            </>
          )}

          {/* Subscription Card */}
          <div
            className={`flex flex-col rounded-[20px] bg-base-100 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-12 ${!loading && demos.length % 2 === 0 ? "mx-auto max-w-xl lg:col-span-2" : ""}`}
          >
            <span className="scroll-animate mb-6 font-['Caveat'] text-[30px] font-bold">
              Start Growing Today
            </span>
            <h3 className="scroll-animate mb-8 max-w-md font-heading text-[32px] font-medium sm:text-[40px]">
              Launch Smarter. Sell Faster. Cancel Anytime.
            </h3>
            <ul className="scroll-animate mb-8 space-y-4 font-sans text-base-content-muted">
              <li className="flex items-center gap-3 font-medium">
                ✔ Frequent theme updates & fixes
              </li>
              <li className="flex items-center gap-3 font-medium">
                ✔ Bi-monthly Help articles & tutorials publish
              </li>
              <li className="flex items-center gap-3 font-medium">
                ✔ 24/7 support from Shopify experts
              </li>
            </ul>

            <div className="mt-auto flex flex-col items-center gap-6 sm:flex-row sm:items-start lg:mt-0">
              <div className="flex flex-col items-center gap-3 sm:items-start">
                <button
                  className="btn-orange cursor-pointer rounded-[120px] px-6 py-4 font-sans text-[18px] sm:text-[20px]"
                  onClick={() =>
                    document
                      .getElementById("pricing")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Get Shoptimity Now
                </button>
                <CTABadges className="items-center justify-center sm:justify-start" />
              </div>
              <img
                className="w-[116px] sm:mt-4"
                src="/assets/trustpilot.png"
                alt="Trustpilot"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default ReadyDemos
