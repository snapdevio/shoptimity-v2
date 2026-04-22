"use client"

import React, { useState } from "react"

interface Feature {
  id: string
  title: string
  desc: string
  icon: React.ReactNode
  img: string
  isBrowser?: boolean
}

interface ConversionFeaturesProps {
  featuresOverride?: Feature[]
}

const ConversionFeatures: React.FC<ConversionFeaturesProps> = ({
  featuresOverride,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0)

  const defaultFeatures: Feature[] = [
    {
      id: "mobile",
      title: "Shoptimity is a Mobile-first Theme",
      desc: "Shoptimity puts mobile performance first—helping you capture, engage, and convert shoppers effortlessly.",
      icon: (
        <svg
          className="h-6 w-6 text-white md:h-8 md:w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      img: "/assets/three-mobile.webp",
    },
    {
      id: "speed",
      title: "Speed That Sets You Ahead",
      desc: "Lightning-fast load times that keep your customers engaged and boost your Shopify store's SEO rankings.",
      icon: (
        <svg
          className="h-6 w-6 text-white md:h-8 md:w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      img: "/assets/speed-mockup.webp",
      isBrowser: true,
    },
    {
      id: "search",
      title: "Scale Your Search Presence Easily",
      desc: "Designed to convert, guiding users to the right products in seconds",
      icon: (
        <svg
          className="h-6 w-6 text-white md:h-8 md:w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
      img: "/assets/scale-search.webp",
      isBrowser: true,
    },
  ]

  const features = featuresOverride || defaultFeatures

  return (
    <section
      id="conversion-features"
      className="relative overflow-hidden bg-[#111111] py-16 text-white md:py-24"
    >
      <div className="scroll-animate mx-auto flex max-w-7xl flex-col items-center gap-16 px-6 md:gap-24 md:px-10 lg:flex-row">
        {/* Left Content: Vertical Features */}
        <div className="relative w-full md:pl-12 lg:w-1/2">
          {/* Vertical Track Line */}
          <div className="absolute top-0 bottom-0 left-0 hidden w-px bg-white/5 md:block">
            <div
              id="feature-indicator"
              className="absolute h-[110px] w-[4px] rounded-full bg-primary shadow-[0_0_20px_rgba(255,89,36,0.6)] md:h-[160px]"
              style={{
                top: `${activeIndex * 150}px`,
                transform: "translateY(16px) md:translateY(0px)",
              }}
            ></div>
          </div>

          <div className="relative space-y-16">
            {features.map((feature, idx) => (
              <div
                key={feature.id}
                className={`feature-item group cursor-pointer transition-opacity duration-300 ${activeIndex === idx ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
                onClick={() => setActiveIndex(idx)}
              >
                <div className="flex items-start gap-6 md:gap-8">
                  <div
                    className={`feature-icon-box z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-500 md:h-16 md:w-16 ${
                      activeIndex === idx
                        ? "bg-primary shadow-lg shadow-orange-500/20"
                        : "border border-white/5 bg-base-content"
                    }`}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3
                      className={`feature-title mb-4 font-heading text-2xl font-bold tracking-tight transition-colors md:text-3xl lg:text-4xl ${activeIndex === idx ? "text-white" : ""}`}
                    >
                      {feature.title}
                    </h3>
                    <div
                      className={`feature-desc overflow-hidden transition-all duration-500 ${activeIndex === idx ? "max-h-[150px] opacity-100" : "max-h-0 opacity-0"}`}
                    >
                      <p className="max-w-md font-sans leading-relaxed text-white/50">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content: Floating Mockups */}
        <div className="relative hidden min-h-[500px] w-full lg:block lg:w-1/2">
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/20 blur-[130px]"></div>

          <div className="relative flex h-full w-full max-w-[600px] items-center justify-center pt-12">
            {features.map((feature, idx) => (
              <div
                key={feature.id}
                className={`mockup-view w-full transition-all duration-700 ${activeIndex === idx ? "z-20 opacity-100" : "pointer-events-none absolute opacity-0"}`}
              >
                {feature.isBrowser ? (
                  <div className="w-full max-w-[550px] overflow-hidden rounded-2xl border border-white/10 bg-base-content shadow-2xl">
                    <div className="flex h-8 items-center gap-1.5 border-b border-white/5 bg-base-content/80 px-4">
                      <div className="h-2 w-2 rounded-full bg-red-400"></div>
                      <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                      <div className="h-2 w-2 rounded-full bg-green-400"></div>
                    </div>
                    <img
                      src={feature.img}
                      className="h-[320px] w-full object-cover object-top"
                      alt={feature.id}
                    />
                  </div>
                ) : (
                  <img
                    src={feature.img}
                    alt={feature.title}
                    className="h-auto w-full drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)]"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ConversionFeatures
