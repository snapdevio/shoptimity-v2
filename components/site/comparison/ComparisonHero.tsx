"use client"

import React from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import CTABadges from "../CTABadges"
import { useBasePrice } from "@/hooks/use-base-price"

interface ComparisonHeroProps {
  competitorName: string
  headline: string
  subheadline: string
  imageSrc: string
}

const ComparisonHero: React.FC<ComparisonHeroProps> = ({
  competitorName,
  headline,
  subheadline,
  imageSrc,
}) => {
  const { trialDays } = useBasePrice()

  return (
    <section className="relative overflow-hidden bg-white py-10 sm:pt-16 sm:pb-20 md:py-28">
      {/* ClickUp-style subtle halo background */}
      <div className="absolute top-0 left-1/2 -z-10 h-150 w-full -translate-x-1/2 rounded-full bg-linear-to-b from-orange-50/50 to-transparent blur-[120px]"></div>

      <div className="mx-auto max-w-7xl px-4 lg:px-12">
        <div className="flex flex-col items-center gap-12 text-center lg:flex-row lg:items-center lg:gap-20 lg:text-left">
          <div className="relative flex-1">
            <div className="relative z-10 overflow-hidden rounded-[24px] bg-white shadow-[0_50px_100px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
              <img
                src={imageSrc}
                alt={`Shoptimity vs ${competitorName}`}
                className="h-auto w-full rounded-[18px]"
              />
            </div>
          </div>
          <div className="flex-1 lg:max-w-2xl">
            {/* ClickUp-style Badge */}
            <div className="mb-6 inline-flex flex-col">
              <span className="text-xs font-black tracking-[0.2em] text-primary capitalize italic opacity-80">
                {/* The #1 Conversion-First Replacement */}
                Shoptimity{" "}
                <span className="mx-1 text-gray-900 uppercase">vs</span>{" "}
                {competitorName}
              </span>
              <div className="mt-2 hidden h-0.5 w-48 bg-primary/30 md:block"></div>
            </div>

            <h1 className="serif-heading mb-6 text-2xl leading-[1.05] font-bold tracking-tight text-base-content md:text-[56px] lg:text-5xl">
              {headline}
            </h1>

            <p className="mb-10 max-w-xl text-lg leading-relaxed text-base-content-muted">
              {subheadline}
            </p>

            <div className="flex flex-col items-center gap-8 lg:items-start">
              <div className="flex w-full flex-col items-center gap-3 sm:w-auto lg:items-start">
                <Link
                  href="/plans"
                  className="btn-orange group relative flex w-full max-w-md cursor-pointer items-center justify-center gap-3 rounded-full px-10 py-5 text-sm font-bold capitalize shadow-[0_20px_40px_rgba(255,89,36,0.3)] transition-all hover:scale-105 active:scale-95 sm:w-auto lg:text-lg"
                >
                  Start Your Free Trial
                  <ArrowRight className="transition-transform group-hover:translate-x-1" />
                </Link>
                <div className="mx-auto mt-2">
                  <CTABadges trialDays={trialDays} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ComparisonHero
