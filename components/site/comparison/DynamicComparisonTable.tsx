"use client"

import React from "react"
import { Check, X } from "lucide-react"
import { ComparisonFeature } from "@/lib/comparison-data"

interface DynamicComparisonTableProps {
  competitorName: string
  features: ComparisonFeature[]
}

const DynamicComparisonTable: React.FC<DynamicComparisonTableProps> = ({
  competitorName,
  features,
}) => {
  return (
    <section className="bg-[#FDFCF5] py-16 md:py-24" id="compare-table">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-16 text-center">
          <h2 className="serif-heading mb-4 text-2xl font-normal tracking-tight text-black md:text-[3.5rem]">
            Shoptimity vs {competitorName}
          </h2>
          <p className="mx-auto max-w-2xl text-gray-500 md:text-lg">
            Compare the features of Shoptimity and {competitorName} with our
            comprehensive comparison and see why Shoptimity is the top choice
            for businesses.
          </p>
        </div>

        <div className="relative mt-8 md:mt-16">
          <div className="scrollbar-hide w-full overflow-x-auto pb-6 md:pb-12">
            <table className="w-full min-w-[700px] border-separate border-spacing-0 text-left md:min-w-6xl">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="w-[40%] px-4 py-4 text-[10px] font-bold tracking-wide text-transparent uppercase transition-colors md:px-8 md:py-6 md:text-xs md:text-gray-400"
                  ></th>
                  <th
                    scope="col"
                    className="w-[30%] rounded-t-xl border-x-[3px] border-t-[3px] border-orange-300 px-2 py-4 text-center text-[15px] font-bold text-orange-500 transition-all sm:text-lg md:rounded-t-[40px] md:px-6 md:py-6 md:text-xl"
                  >
                    Shoptimity
                  </th>
                  <th
                    scope="col"
                    className="w-[30%] px-2 py-4 text-center text-[15px] font-semibold text-gray-500 transition-all sm:text-lg md:px-6 md:py-6 md:text-xl"
                  >
                    {competitorName}
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => {
                  const isAlt = index % 2 === 0
                  const rowBg = isAlt ? "bg-[#FAF6F1]" : "bg-transparent"
                  const isLast = index === features.length - 1

                  return (
                    <tr key={index}>
                      <th
                        scope="row"
                        className={`rounded-l-xl px-4 py-3 align-middle transition-colors md:rounded-l-[40px] md:px-8 md:py-5 ${rowBg} ${
                          isLast ? "pb-8 md:pb-10" : ""
                        }`}
                      >
                        <div className="flex min-h-[48px] flex-col justify-center md:min-h-[64px]">
                          <span className="text-[13px] leading-tight font-medium whitespace-normal text-gray-800 md:text-[15px]">
                            {feature.name}
                          </span>
                          {feature.description && (
                            <span className="mt-1 hidden text-[13px] font-normal text-gray-500 md:block">
                              {feature.description}
                            </span>
                          )}
                        </div>
                      </th>
                      <td
                        className={`border-x-[3px] border-orange-300 px-1 text-center align-middle transition-colors ${rowBg} ${
                          isLast
                            ? "rounded-b-xl border-b-[3px] md:rounded-b-[40px]"
                            : ""
                        }`}
                      >
                        <div className="flex min-h-[48px] items-center justify-center md:min-h-[64px]">
                          {typeof feature.shoptimity === "boolean" ? (
                            feature.shoptimity ? (
                              <Check
                                className="h-5 w-5 text-[#139D4B] md:h-[22px] md:w-[22px]"
                                strokeWidth={2.5}
                              />
                            ) : (
                              <X
                                className="h-4 w-4 text-[#E03131] md:h-5 md:w-5"
                                strokeWidth={2.5}
                              />
                            )
                          ) : (
                            <span className="text-center text-[13px] font-semibold text-gray-900 md:text-[15px]">
                              {feature.shoptimity}
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className={`rounded-r-xl px-1 text-center align-middle transition-colors md:rounded-r-[40px] ${rowBg} ${
                          isLast ? "mb-8 md:mb-10" : ""
                        }`}
                      >
                        <div className="flex min-h-[48px] items-center justify-center md:min-h-[64px]">
                          {typeof feature.competitor === "boolean" ? (
                            feature.competitor ? (
                              <Check
                                className="h-5 w-5 text-[#139D4B] md:h-[22px] md:w-[22px]"
                                strokeWidth={2.5}
                              />
                            ) : (
                              <X
                                className="h-4 w-4 text-[#E03131] md:h-5 md:w-5"
                                strokeWidth={2.5}
                              />
                            )
                          ) : (
                            <span className="text-center text-[13px] font-semibold text-balance text-gray-500 md:text-[15px]">
                              {feature.competitor}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DynamicComparisonTable
