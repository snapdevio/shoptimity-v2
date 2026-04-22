"use client"

import React, { useEffect, useRef } from "react"

const features = [
  {
    title: "98.9 Speed Score",
    description:
      "Built with cutting-edge code to ensure your store loads in a blink, reducing bounce rates and improving SEO.",
    icon: (
      <svg
        className="h-8 w-8 text-orange-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    color: "bg-orange-50",
  },
  {
    title: "30+ Native Apps",
    description:
      "Built-in Quantity Breaks, Sticky Carts, and more. Everything you need without the monthly subscription fees.",
    icon: (
      <svg
        className="h-8 w-8 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
    color: "bg-blue-50",
  },
  {
    title: "Mobile First Design",
    description:
      "80% of sales happen on mobile. Our theme is crafted for an flawless shopping experience on any device.",
    icon: (
      <svg
        className="h-8 w-8 text-purple-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    ),
    color: "bg-purple-50",
  },
  {
    title: "One-Time Payment",
    description:
      "Forget recurring bills. Pay once and get lifetime updates and support for your Shopify store.",
    icon: (
      <svg
        className="h-8 w-8 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    color: "bg-green-50",
  },
]

const LandingFeaturesGrid: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null)

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

  return (
    <section
      ref={sectionRef}
      className="mx-auto max-w-7xl overflow-hidden py-10 md:py-24"
    >
      <div className="container mx-auto px-6">
        <div className="mb-10 text-center md:mb-16">
          <h2 className="scroll-animate mb-4 font-heading text-[32px] md:text-5xl">
            Why Top Merchants Choose{" "}
            <span className="text-gradient-orange-pink">Shoptimity</span>
          </h2>
          <p className="scroll-animate transition-delay-100 mx-auto max-w-2xl text-gray-600 md:text-lg">
            We've audited 1,000+ stores to build the perfection tool for
            high-ticket dropshipping and brand building.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`scroll-animate group cursor-default rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] hover:-translate-y-4 hover:border-orange-500/20 hover:shadow-[0_20px_60px_-15px_rgba(255,96,46,0.15)]`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div
                className={`h-16 w-16 ${feature.color} mb-6 flex items-center justify-center rounded-2xl transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-110`}
              >
                {feature.icon}
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LandingFeaturesGrid
