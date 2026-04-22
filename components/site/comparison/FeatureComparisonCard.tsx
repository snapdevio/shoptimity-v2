"use client"

import React from "react"
import Image from "next/image"

interface Feature {
  title: string
  description: string
  imageSrc: string
  imageBgColor?: string
}

interface FeatureHighlightProps {
  features: Feature[]
  sectionTitle?: string
}

const FeatureComparisonCard: React.FC<FeatureHighlightProps> = ({
  features,
  sectionTitle,
}) => {
  const bgColors = [
    "bg-[#F2F9F5]",
    "bg-[#FFFBF0]",
    "bg-[#F0F6FC]",
    "bg-[#FCF0F5]",
  ]

  return (
    <section className="bg-white py-8 md:py-12 lg:py-18">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {sectionTitle && (
          <div className="mb-16 text-center md:mb-24">
            <h2 className="serif-heading mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
              {sectionTitle}
            </h2>
            <div className="mx-auto h-1 w-20 rounded-full bg-orange-500/20" />
          </div>
        )}

        <div className="space-y-12 md:space-y-16">
          {features.map((feature, index) => {
            const isImageLeft = index % 2 === 0
            const bgColor =
              feature.imageBgColor || bgColors[index % bgColors.length]

            return (
              <div
                key={index}
                className={`group flex flex-col items-stretch overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] lg:flex-row ${
                  !isImageLeft ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Image Section */}
                <div
                  className={`relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden ${bgColor}`}
                >
                  {/* Subtle background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative z-10 w-full max-w-[500px]">
                    <img
                      src={feature.imageSrc}
                      alt={feature.title}
                      className="h-auto w-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.1)] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                </div>

                {/* Text Section */}
                <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:p-12 lg:p-12 xl:p-16">
                  <div className="w-full max-w-[480px]">
                    <h3 className="mb-6 text-xl leading-[1.2] font-bold tracking-tight text-gray-900 sm:text-2xl md:text-3xl lg:text-[2rem]">
                      {feature.title}
                    </h3>
                    <p className="text-base leading-relaxed text-gray-600 md:text-lg">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FeatureComparisonCard
