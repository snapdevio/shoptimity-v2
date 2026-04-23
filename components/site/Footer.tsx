"use client"
import React from "react"
import { useBasePrice } from "@/hooks/use-base-price"
import CTABadges from "./CTABadges"

const Footer: React.FC = () => {
  const { basePrice, trialDays } = useBasePrice()
  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <footer className="relative overflow-hidden px-4 pt-16 pb-24 sm:px-6 md:pt-20 md:pb-40">
      <img
        src="/assets/footer-bg-image.webp"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />

      <div className="relative mx-auto max-w-7xl text-center">
        <div className="scroll-animate mb-8 flex items-center justify-center gap-2 md:mb-10">
          <img
            src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT || ""}/assets/logo.svg`}
            className="h-10 w-auto"
            alt="Shoptimity Logo"
          />
          {/* <span className="text-2xl font-bold tracking-tight md:text-4xl">
            Shoptimity
          </span> */}
        </div>

        <h2 className="scroll-animate mx-auto mb-8 max-w-3xl font-heading text-2xl leading-tight font-bold sm:text-3xl md:mb-10 md:text-4xl md:leading-[54px] lg:text-[40px]">
          Your Path to{" "}
          <span className="relative inline-block text-primary">
            Superb Interactive
            <span className="absolute right-0 -bottom-0.5 left-0 h-[3px] rounded-full bg-primary md:-bottom-1 md:h-[4px]"></span>
          </span>{" "}
          Shopping Experiences
        </h2>

        <p className="scroll-animate mx-auto mb-8 max-w-xl font-sans text-base text-base-content-muted sm:text-lg md:mb-10">
          Drive higher conversions with an outstanding UX experience.
        </p>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={scrollToPricing}
            className="inline-flex h-[56px] w-full cursor-pointer items-center justify-center rounded-lg bg-base-content font-sans text-base font-normal text-primary-content transition hover:scale-[1.03] sm:w-[260px] md:h-[60px] md:text-lg"
          >
            Get Started For Free
          </button>
          <CTABadges className="items-center justify-center" />
        </div>
      </div>
    </footer>
  )
}

export default Footer
