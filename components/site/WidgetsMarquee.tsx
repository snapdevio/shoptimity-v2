"use client"
import React from "react"
import CTABadges from "./CTABadges"

import {
  GalleryHorizontal,
  Grid3x2,
  ImagePlay,
  LucideIcon,
  MonitorPlay,
  Pipette,
  Radio,
  Ruler,
  SportShoe,
} from "lucide-react"

interface Widget {
  title: string
  desc: string
  icon: LucideIcon
}

const WidgetsMarquee: React.FC = () => {
  const row1: Widget[] = [
    {
      title: "Swatches",
      desc: "Shoppers can quickly find their preferred colors, making the purchase process smoother.",
      icon: Pipette,
    },
    {
      title: "Product Videos",
      desc: "Showcase items in action, providing a richer shopping experience for customers.",
      icon: MonitorPlay,
    },
    {
      title: "Image Galleries",
      desc: "Showcase stunning visuals that give customers a complete view of every product.",
      icon: Grid3x2,
    },
    {
      title: "Animation",
      desc: "Add a touch of liveliness & appeal to your brand, drawing attention to key products & promotions.",
      icon: SportShoe,
    },
  ]

  const row2: Widget[] = [
    {
      title: "Size Chart",
      desc: "Help customers find their perfect fit, reducing product returns & increasing satisfaction.",
      icon: Ruler,
    },
    {
      title: "Slideshow",
      desc: "Capture customer attention with dynamic presentations of featured products.",
      icon: GalleryHorizontal,
    },
    {
      title: "Image Rollover",
      desc: "Shoppers can quickly see different views of a product, helping them make decisions.",
      icon: ImagePlay,
    },
    {
      title: "Multi-Currency",
      desc: "Reach global shoppers by displaying prices in their local currencies.",
      icon: Radio,
    },
  ]

  const WidgetCard: React.FC<Widget> = ({ title, desc, icon: Icon }) => (
    <div className="flex h-[150px] w-[250px] shrink-0 gap-[18px] rounded-xl bg-base-100 p-6 md:h-[168px] md:w-[350px]">
      <Icon className="-mt-3 h-14 w-14 text-orange-500" />
      <div>
        <h5 className="text-md mb-1 font-semibold md:text-xl">{title}</h5>
        <p className="line-clamp-3 text-sm text-base-content-muted md:text-base">
          {desc}
        </p>
      </div>
    </div>
  )

  return (
    <section className="overflow-hidden bg-base-300 py-16 md:py-24">
      <div className="scroll-animate relative mb-16 flex justify-center px-4">
        <div className="pointer-events-none absolute -top-32 h-[260px] w-[420px] bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,89,36,0.15)_0%,rgba(255,89,36,0)_100%)] md:-top-44 md:h-[350px] md:w-[700px]"></div>
        <h2 className="serif-heading relative z-10 text-center font-heading text-4xl md:text-[60px]">
          Widgets <span className="text-gradient-orange-pink">We Provide</span>
        </h2>
      </div>

      <div className="mb-8 overflow-hidden">
        <div className="animate-row-left flex w-max gap-6 font-sans">
          {[...row1, ...row1].map((w, idx) => (
            <WidgetCard key={idx} {...w} />
          ))}
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="animate-row-right flex w-max gap-6 font-sans">
          {[...row2, ...row2].map((w, idx) => (
            <WidgetCard key={idx} {...w} />
          ))}
        </div>
      </div>

      <div className="scroll-animate mt-20 flex justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <button
            className="btn-orange cursor-pointer rounded-full px-8 py-4 font-sans text-base md:px-10 md:text-lg"
            onClick={() =>
              document
                .getElementById("pricing")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Get Shoptimity Now
          </button>
          <CTABadges className="items-center justify-center" />
        </div>
      </div>
    </section>
  )
}

export default WidgetsMarquee
