"use client"
import React from "react"

interface StepItem {
  id: string
  title: string
  desc: string
  video: string
  bg: string
  iconColor: string
}

const StepsSection: React.FC = () => {
  const R2_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT || ""
  const steps: StepItem[] = [
    {
      id: "01",
      title: "Choose Your Template",
      desc: "Choose from our selection of proven high-performing templates.",
      video: `${R2_URL}/shoptimity-v2/assets/store-to-brand-step-one.mp4`,
      bg: "bg-[#FFF0F3]",
      iconColor: "text-[#FF6FB5]",
    },
    {
      id: "02",
      title: "Add Your Customizations",
      desc: "Transfer over your content and use our theme colors to seamlessly change colors of the site in a couple clicks.",
      video: "/assets/store-to-brand-step-two.mp4",
      bg: "bg-[#F0F5FD]",
      iconColor: "text-[#4A90E2]",
    },
    {
      id: "03",
      title: "Split Test & Scale",
      desc: "Run ads and split test with our stack of 100+ blocks and sections!",
      video: "/assets/store-to-brand-step-three.mp4",
      bg: "bg-[#FFF8F2]",
      iconColor: "text-[#FF602E]",
    },
  ]

  return (
    <section className="scroll-animate bg-base-300 px-4 py-10 sm:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 text-center md:mb-16">
          <h2 className="scroll-animate font-heading text-[30px] text-base-content md:text-[42px] lg:text-[60px]">
            Store to brand in{" "}
            <span className="text-gradient-orange-pink bg-clip-text text-transparent">
              3 steps
            </span>
          </h2>
        </div>

        <div className="scroll-animate mx-auto grid max-w-7xl gap-6 font-sans md:gap-8 lg:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className="scroll-animate flex flex-col items-center rounded-[24px] border bg-base-300 p-5 text-center shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6"
            >
              <div
                className={`mb-6 w-full overflow-hidden rounded-[16px] ${step.bg} relative flex items-center justify-center`}
              >
                <video
                  className="relative z-10 h-full w-full rounded-[16px] object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  onError={(e) => {
                    ;(e.target as HTMLVideoElement).style.display = "none"
                  }}
                >
                  <source src={step.video} type="video/mp4" />
                </video>
                <div
                  className={`absolute inset-0 z-0 flex items-center justify-center ${step.iconColor} opacity-30`}
                >
                  <svg
                    className="h-20 w-20"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-[32px] font-bold text-base-content">
                {step.id}
              </h3>
              <h4 className="mb-3 text-[18px] font-medium text-base-content md:text-[20px]">
                {step.title}
              </h4>
              <p className="text-[14px] leading-relaxed text-base-content-muted md:text-[15px]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StepsSection
