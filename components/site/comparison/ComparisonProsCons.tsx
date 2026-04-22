"use client"

import React from "react"
import { PlusCircle, MinusCircle } from "lucide-react"

interface ComparisonProsConsProps {
  competitorName: string
  pros: string[]
  cons: string[]
}

const ComparisonProsCons: React.FC<ComparisonProsConsProps> = ({
  competitorName,
  pros,
  cons,
}) => {
  return (
    <section className="bg-white py-8 lg:py-18">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-4 md:gap-12 lg:grid-cols-2">
          {/* Why Switching to Shoptimity */}
          <div className="rounded-[2.5rem] bg-orange-50 p-6 sm:p-10 md:p-14">
            <h3 className="serif-heading mb-8 text-xl font-bold text-black md:text-3xl">
              Why merchants{" "}
              <span className="text-orange-600">prefer Shoptimity</span>
            </h3>
            <ul className="space-y-6">
              {pros.map((pro, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500">
                    <PlusCircle size={16} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-800 md:text-lg">
                    {pro}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* The Pain Points of Competitor */}
          <div className="rounded-[2.5rem] bg-gray-100 p-6 sm:p-10 md:p-14">
            <h3 className="serif-heading mb-8 text-xl font-bold text-black md:text-3xl">
              The{" "}
              <span className="text-gray-400">{competitorName} struggle</span>
            </h3>
            <ul className="space-y-6">
              {cons.map((con, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200">
                    <MinusCircle size={16} className="text-gray-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 md:text-lg">
                    {con}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center md:mt-16">
          <p className="text-gray-500 italic">
            "Shoptimity replaced our entire app stack. No more monthly add-on
            fees, no more clashing code, just a lightning-fast store that
            actually converts."
          </p>
          <p className="mt-2 font-bold text-black">— Verified Store Owner</p>
        </div>
      </div>
    </section>
  )
}

export default ComparisonProsCons
