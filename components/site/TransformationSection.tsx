"use client"

import { useState } from "react"
import {
  CircleDollarSign,
  SlidersHorizontal,
  Zap,
  MessageSquare,
} from "lucide-react"

const features = [
  {
    icon: <CircleDollarSign className="h-5 w-5 text-emerald-500" />,
    title: "Built to Make Money",
  },
  {
    icon: <SlidersHorizontal className="h-5 w-5 text-rose-500" />,
    title: "Endless Customization",
  },
  {
    icon: <Zap className="h-5 w-5 text-amber-400" />,
    title: "Fast Performance",
  },
  {
    icon: <MessageSquare className="h-5 w-5 text-orange-400" />,
    title: "24/7 Support",
  },
]

export default function TransformationSection() {
  const [sliderPosition, setSliderPosition] = useState(50)

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value))
  }

  const beforeImage = "/assets/before-shoptimity.webp"
  const afterImage = "/assets/after-shoptimity.webp"

  return (
    <section className="overflow-hidden bg-base-300 px-4 py-8 md:px-8 md:py-14">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div className="flex w-full justify-center lg:order-2">
          <div className="group relative w-full max-w-[650px] rounded-[2.5rem] border border-gray-100 bg-white p-2 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] md:p-3">
            <div className="relative overflow-hidden rounded-[1.5rem] bg-gray-50">
              <img
                src={afterImage}
                alt="After Shoptimity Dashboard"
                className="relative z-0 block h-auto w-full"
              />

              <div
                className="absolute top-4 right-4 z-20 rounded-full bg-[#FF602E] px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase shadow-lg transition-opacity duration-300"
                style={{ opacity: sliderPosition > 90 ? 0 : 1 }}
              >
                After
              </div>

              <div
                className="absolute inset-0 z-10 h-full w-full"
                style={{
                  clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                }}
              >
                <img
                  src={beforeImage}
                  alt="Before Shoptimity Dashboard"
                  className="h-full w-full object-cover"
                />
                <div
                  className="absolute top-4 left-4 z-20 rounded-full bg-[#FF602E] px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase shadow-lg transition-opacity duration-300"
                  style={{ opacity: sliderPosition < 10 ? 0 : 1 }}
                >
                  Before
                </div>
              </div>

              <div
                className="pointer-events-none absolute top-0 bottom-0 z-30 w-[2px] bg-white shadow-[0_0_15px_rgba(0,0,0,0.2)]"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white/20 bg-white p-1 shadow-[0_0_40px_rgba(0,0,0,0.2)] backdrop-blur-md">
                  <div className="flex items-center gap-1.5">
                    <div className="h-0 w-0 border-y-[5px] border-r-[7px] border-y-transparent border-r-[#FF602E]" />
                    <div className="h-0 w-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-[#FF602E]" />
                  </div>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={sliderPosition}
                onChange={handleSliderChange}
                className="absolute inset-0 z-40 h-full w-full cursor-ew-resize appearance-none opacity-0"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8 text-center lg:order-1 lg:items-start lg:pr-4 lg:text-left">
          <div className="inline-block">
            <span className="inline-flex items-center rounded-full border border-[#FF602E]/20 bg-[#FF602E]/5 px-5 py-2 text-sm font-semibold tracking-tight text-[#FF602E]">
              What makes Shoptimity different
            </span>
          </div>

          <h2 className="font-heading text-4xl leading-[1.05] tracking-tight text-base-content md:text-6xl">
            <span className="block">
              Why <span className="text-gradient-orange-pink">10,000+</span>
            </span>
            <span className="block">Stores Choose</span>
            <span className="block">Shoptimity</span>
          </h2>

          <p className="max-w-lg leading-relaxed font-medium text-base-content-muted md:text-xl">
            Every feature is built with one goal in mind: help you sell more.
          </p>

          <div className="grid w-full grid-cols-2 gap-x-4 gap-y-6 border-gray-100 md:grid-cols-2 md:gap-y-10 lg:w-auto lg:gap-x-12">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group flex flex-col items-center justify-center gap-3 text-center lg:flex-row lg:justify-start lg:text-left"
              >
                <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-[#FF602E]/10 group-hover:shadow-md">
                  {feature.icon}
                </div>
                <span className="text-base font-bold tracking-tight text-base-content md:text-lg">
                  {feature.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
