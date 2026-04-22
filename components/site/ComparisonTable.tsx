"use client"

import React, { useEffect, useRef } from "react"

const ComparisonTable: React.FC = () => {
  const tableRef = useRef<HTMLDivElement>(null)

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

    const elements = tableRef.current?.querySelectorAll(".scroll-animate")
    elements?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={tableRef} className="bg-base-100 py-24">
      <div className="container mx-auto px-6">
        <div className="scroll-animate mx-auto max-w-4xl overflow-hidden rounded-[40px] border border-gray-100 bg-white shadow-2xl">
          <div className="p-10 md:p-14">
            <h2 className="scroll-animate transition-delay-100 mb-12 text-center font-heading text-3xl md:text-5xl">
              Built for{" "}
              <span className="text-gradient-orange-pink">Growth</span>, Not
              Just Design
            </h2>

            <div className="mb-8 grid grid-cols-3 gap-4 text-sm md:text-base">
              <div className="col-span-1 border-b pb-4"></div>
              <div className="col-span-1 border-b pb-4 text-center font-bold text-gray-400">
                Standard Themes
              </div>
              <div className="col-span-1 border-b pb-4 text-center font-bold text-orange-500">
                Shoptimity
              </div>

              {[
                {
                  feature: "Page Load Speed",
                  standard: "2.4s - 4s",
                  shoptimity: "0.8s",
                },
                {
                  feature: "Mobile Conversion",
                  standard: "Basic",
                  shoptimity: "Optimized",
                },
                {
                  feature: "App Dependency",
                  standard: "10-15 Apps",
                  shoptimity: "Native",
                },
                {
                  feature: "Monthly Cost",
                  standard: "$200 - $400",
                  shoptimity: "$0",
                },
                {
                  feature: "AOV Tools",
                  standard: "Paid Apps",
                  shoptimity: "Built-in",
                },
              ].map((row, i) => (
                <React.Fragment key={i}>
                  <div className="col-span-1 border-b border-gray-50 py-4 font-medium">
                    {row.feature}
                  </div>
                  <div className="col-span-1 border-b border-gray-50 py-4 text-center text-gray-400">
                    {row.standard}
                  </div>
                  <div className="col-span-1 rounded-lg border-b border-orange-50 bg-orange-50/30 py-4 text-center font-bold text-orange-600">
                    {row.shoptimity}
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="text-sm text-gray-500 italic">
                Join the 10,000+ merchants who switched and never looked back.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ComparisonTable
