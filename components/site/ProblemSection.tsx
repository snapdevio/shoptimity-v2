import React from "react"

const ProblemSection: React.FC = () => {
  return (
    <section className="bg-base-100 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="scroll-animate mb-12 font-heading text-[32px] leading-tight font-bold text-base-content md:text-[48px] lg:text-[56px]">
          Most Shopify Stores Don’t Fail Because of Traffic…
        </h2>

        <div className="grid gap-6 md:grid-cols-2 md:text-left">
          {[
            { text: "Visitors don’t convert", icon: "❌" },
            { text: "Too many paid apps slowing your store", icon: "❌" },
            { text: "Poor mobile experience", icon: "❌" },
            { text: "Confusing navigation → lost sales", icon: "❌" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="scroll-animate flex items-center gap-4 rounded-2xl border bg-base-300 p-6 transition-all hover:border-primary/50"
            >
              <span className="text-2xl">{item.icon}</span>
              <p className="font-sans text-lg font-medium text-base-content">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="scroll-animate mt-16">
          <p className="font-heading text-2xl font-bold text-primary md:text-4xl">
            You don’t need more traffic. <br className="hidden md:block" />
            <span className="text-base-content">
              You need a store that converts.
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}

export default ProblemSection
