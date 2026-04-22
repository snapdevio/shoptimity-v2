import React from "react"

const FeaturesWave: React.FC = () => {
  return (
    <div className="flex min-h-[660px] w-full items-center justify-center bg-base-100 p-4">
      <section className="scroll-animate relative flex h-[500px] w-full max-w-[1240px] flex-col items-center justify-center gap-0 overflow-visible rounded-[20px] bg-base-200">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px] opacity-40">
          <img
            src="/assets/wave.webp"
            className="h-full w-full object-cover"
            alt="Wave Background"
          />
        </div>

        <div className="relative z-10 px-6 text-center">
          <p className="scroll-animate mb-[36.65px] font-['Caveat'] text-[30px] leading-[36px] font-bold text-base-content">
            Shoptimity Features
          </p>

          <h2 className="scroll-animate text-center font-heading text-[30px] leading-tight font-semibold text-base-content md:text-5xl">
            <span className="mb-2 block">
              Powerful{" "}
              <span className="text-gradient-orange-pink">Must-Have</span>
            </span>
            <span className="mb-[30px] block">
              {" "}
              Features for Shopify Store{" "}
            </span>
          </h2>

          <p className="scroll-animate mx-auto mb-[55.63px] max-w-xl font-sans leading-relaxed text-base-content-muted/90">
            Enhance your digital venture with top-tier performance, smart
            recommendations, & limitless settings.
          </p>
        </div>

        <div className="absolute -bottom-14 left-1/2 flex -translate-x-1/2 items-center justify-center">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-[181px] bg-base-300">
            <div className="animate-spin-slow absolute inset-0">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <defs>
                  <path
                    id="circlePath"
                    d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                  ></path>
                </defs>
                <text className="fill-base-content-muted font-heading text-[10px] font-bold tracking-[0.2em] uppercase">
                  <textPath xlinkHref="#circlePath">
                    Scroll Down to Explore More
                  </textPath>
                </text>
              </svg>
            </div>
            <div className="z-20 rounded-full p-3">
              <svg
                className="h-7 w-7 text-primary"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default FeaturesWave
