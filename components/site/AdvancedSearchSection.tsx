import React from "react"

const AdvancedSearchSection: React.FC = () => {
  return (
    <section className="bg-base-300 px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="scroll-animate mb-14 text-center md:mb-16">
          <span className="mb-6 inline-block rounded-full border bg-base-300 px-4 py-1.5 font-sans text-[10px] font-bold tracking-widest">
            Advanced Search
          </span>

          <h2 className="font-heading text-[32px] leading-[1.1] lg:text-6xl">
            <span className="text-gradient-orange-pink block">
              Advanced Search
            </span>
            Finds Correct Results
          </h2>
        </div>

        {/* Content Grid */}
        <div className="grid items-stretch gap-10 lg:grid-cols-2 lg:gap-12">
          {/* LEFT BIG CARD */}
          <div className="scroll-animate flex flex-col justify-center rounded-[28px] bg-base-100 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-[40px] sm:p-8">
            {/* Image */}
            <div className="scroll-animate mb-8 flex items-center justify-center overflow-hidden rounded-2xl bg-base-300 sm:rounded-3xl">
              <img
                src="/assets/advanced-search.webp"
                alt="Advanced Search"
                className="h-auto w-full object-contain"
              />
            </div>

            {/* Text */}
            <div className="scroll-animate">
              <h3 className="mb-4 max-w-md font-heading text-xl font-medium sm:text-2xl">
                Spend Less Time Searching, Shop Faster with Smart Search
              </h3>

              <p className="font-sans leading-relaxed text-base-content-muted">
                Help customers find what they need instantly with intelligent
                suggestions for products, collections, search terms, and more.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col justify-between gap-6">
            {/* Card 1 */}
            <div className="scroll-animate flex flex-col items-center gap-6 rounded-[28px] bg-base-100 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-[40px] sm:p-8 md:flex-row">
              <div className="scroll-animate flex w-full items-center justify-center overflow-hidden rounded-xl md:w-1/2">
                <img
                  src="/assets/all-product-type.webp"
                  alt="Search by Product Type"
                  className="h-auto w-full object-contain"
                />
              </div>

              <div className="scroll-animate w-full md:w-1/2">
                <h4 className="mb-3 font-heading text-xl font-medium">
                  Shop by Product Category
                </h4>
                <p className="font-sans leading-relaxed text-base-content-muted">
                  Deliver optimized results that help shoppers quickly find
                  exactly what they need and boost conversions.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="scroll-animate flex flex-col items-center gap-6 rounded-[28px] bg-base-100 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-[40px] sm:p-8 md:flex-row">
              <div className="scroll-animate flex w-full items-center justify-center overflow-hidden rounded-xl md:w-1/2">
                <img
                  src="/assets/search-discovery.webp"
                  alt="Search & Discovery"
                  className="h-auto w-full object-contain"
                />
              </div>

              <div className="scroll-animate w-full md:w-1/2">
                <h4 className="mb-3 font-heading text-xl font-medium">
                  Integration with Shopify Search & Discovery app
                </h4>
                <p className="font-sans leading-relaxed text-base-content-muted">
                  Customize and improve predictive search effortlessly using
                  Shopify’s built-in app—no extra setup needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdvancedSearchSection
