"use client"

import React from "react"
import Link from "next/link"
import CTABadges from "../CTABadges"

const ComparisonCTA: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-24 text-center md:py-32">
      <img
        src="/assets/footer-bg-image.webp"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 md:px-8">
        <h2 className="serif-heading mb-5 text-3xl leading-tight font-normal tracking-tight text-black sm:text-5xl md:text-[3.5rem]">
          Ready to upgrade your store?
        </h2>

        <p className="mb-10 max-w-md text-[15px] leading-relaxed text-gray-500 sm:text-base md:text-lg">
          Join thousands of successful brand owners who have already made the
          switch to Shoptimity.
        </p>

        <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Link
            href="/plans"
            className="btn-orange flex w-auto cursor-pointer items-center justify-center rounded-[2rem] px-8 py-3.5 text-[15px] font-medium text-white transition-all hover:bg-orange-700 active:scale-95 sm:w-auto md:w-full"
          >
            Get Shoptimity Now
          </Link>
        </div>
        <CTABadges className="mt-3 items-center justify-center" />
      </div>
    </section>
  )
}

export default ComparisonCTA
