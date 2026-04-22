"use client"

import React from "react"
import { useBasePrice } from "@/hooks/use-base-price"
import CTABadges from "./CTABadges"

interface HeroProps {
  headline?: React.ReactNode
  subheadline?: string
  ctaText?: string
  rating?: string
  trustText?: string
}

const Hero: React.FC<HeroProps> = ({
  headline,
  subheadline,
  ctaText,
  rating,
  trustText,
}) => {
  const { basePrice, trialDays, loading } = useBasePrice()
  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
  }

  const scrollToNicheTemplates = () => {
    document.getElementById("demos")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section
      className="overflow-hidden bg-base-100 px-6 pt-12 pb-10 md:pt-20 md:pb-[100px]"
      id="home"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <h1 className="scroll-animate serif-heading mb-[26px] font-heading text-[28px] leading-tight sm:text-[32px] md:text-[38px] lg:text-5xl">
            {headline || (
              <>
                <span className="block md:mb-3">
                  Scale{" "}
                  <span className="text-gradient-orange-pink">
                    Your Shopify Store
                  </span>
                </span>
                <span className="block"> Faster Without Extra Apps </span>
              </>
            )}
          </h1>

          <p className="scroll-animate mx-auto mb-[26px] max-w-lg font-sans text-[14px] text-base-content-muted md:text-[16px] lg:mx-0">
            {subheadline ? (
              <strong>{subheadline}</strong>
            ) : (
              <>
                <strong>Shoptimity</strong> is a conversion-optimized Shopify
                theme built to increase sales, boost AOV, and eliminate monthly
                app costs — all with a one-time payment.
              </>
            )}
          </p>

          <div className="scroll-animate mb-[26px] flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
            <div className="flex -space-x-3">
              <img
                src="/assets/dummy-profile.image.png"
                className="h-auto w-[130px]"
                alt="User"
              />
            </div>
            <div className="text-center sm:text-left">
              <div className="mb-[3.5px] flex items-center justify-center text-sm text-yellow-400 sm:justify-start">
                <img
                  src="/assets/star.image.png"
                  className="h-auto w-[90px]"
                  alt="stars"
                />
                <span className="ml-1 font-sans font-normal text-base-content">
                  {rating || "4.9"}
                </span>
              </div>
              <p className="font-medium tracking-wider text-base-content">
                {trustText || "500+ reviews on Trustpilot"}
              </p>
            </div>
          </div>

          <div className="scroll-animate flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-start lg:justify-start">
            <div className="flex w-full flex-col items-center gap-3 sm:w-auto lg:items-start">
              <button
                onClick={scrollToPricing}
                className="btn-orange flex min-h-[60px] w-full cursor-pointer items-center justify-center gap-2 rounded-full px-8 py-4 font-sans text-lg sm:w-auto"
              >
                {ctaText ? (
                  ctaText
                ) : loading ? (
                  <span className="block h-6 w-40 animate-pulse rounded bg-white/30"></span>
                ) : trialDays > 0 ? (
                  "Start Free Trial Now"
                ) : (
                  `Get Shoptimity @ ${basePrice}`
                )}
              </button>
              <CTABadges
                trialDays={trialDays}
                className="items-center justify-center lg:justify-start"
              />
            </div>

            <button
              className="flex cursor-pointer items-center gap-2 py-4 font-sans text-lg transition-colors hover:text-orange-600"
              onClick={scrollToNicheTemplates}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary">
                <svg
                  className="h-5 w-5 fill-current text-primary-content"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              View Live Demo
            </button>
          </div>
        </div>

        <div className="scroll-animate relative mx-auto mt-12 w-full max-w-2xl lg:mt-0 lg:max-w-5xl">
          <img
            src="/assets/shoptimity-banner.webp"
            className="w-full rounded-2xl"
            alt="Main banner"
          />

          <div className="scroll-animate absolute top-1/2 left-[-20px] z-20 hidden h-[260px] w-[50px] md:block lg:left-[-40px] lg:w-[75px]">
            <div className="animate-vertical-loop flex flex-col">
              <img
                src="/assets/vertical-banner.png"
                className="w-full"
                alt="Vertical Banner"
                width={75}
                height={260}
              />
            </div>
          </div>

          <div className="scroll-animate absolute bottom-[-20px] left-1/2 z-20 h-[63px] w-[140px] md:bottom-[-32px] md:w-[173px]">
            <div className="animate-horizontal-loop hidden md:block">
              <img
                src="/assets/horizontal-banner.png"
                className="h-full"
                alt="Horizontal Banner"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
