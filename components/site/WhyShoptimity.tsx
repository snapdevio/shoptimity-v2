import React from "react"

interface WhyCard {
  title: string | React.ReactNode
  desc: string
  img: string
}

interface WhyShoptimityProps {
  headline?: string
  subheadline?: string
  cardsOverride?: WhyCard[]
}

const WhyShoptimity: React.FC<WhyShoptimityProps> = ({
  headline,
  subheadline,
  cardsOverride,
}) => {
  const defaultCards: WhyCard[] = [
    {
      title: "Boost AOV, CV & Sales",
      desc: "Increasing AOV boosts revenue per purchase, improving CVR converts more visitors into customers, and higher sales drive sustainable growth.",
      img: "/assets/boost-aov-and-sales.webp",
    },
    {
      title: (
        <>
          Revenue <span className="font-sans">&gt;</span> Profit
        </>
      ),
      desc: "More revenue enhances profitability and cash flow, leading to growth and better audience insights.",
      img: "/assets/revenue-graph.webp",
    },
    {
      title: "Bounce Rate & CLV",
      desc: "Reducing bounce rates turns visitors into loyal repeat customers, supporting long-term growth and brand loyalty.",
      img: "/assets/bounce-rate.webp",
    },
  ]

  const cards = cardsOverride || defaultCards

  return (
    <section className="relative overflow-hidden bg-base-100 px-4 py-16 sm:px-6 md:py-24">
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[220px] w-full -translate-x-1/2 bg-[radial-gradient(50%_50%_at_50%_100%,rgba(255,89,36,0.1)_0%,rgba(255,89,36,0)_100%)] md:h-[300px]"></div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="scroll-animate mb-14 text-center md:mb-20">
          <span className="mb-4 inline-block rounded-full border px-4 py-1.5 font-sans text-[10px] font-bold tracking-widest uppercase">
            CRO & UXO
          </span>
          <h2 className="font-heading text-4xl md:text-6xl">
            {headline ? (
              <span dangerouslySetInnerHTML={{ __html: headline }}></span>
            ) : (
              <>
                Why{" "}
                <span className="text-gradient-orange-pink">Shoptimity?</span>
              </>
            )}
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-sans text-base-content-muted md:max-w-2xl">
            {subheadline ||
              "It maximizes revenue and customer satisfaction by improving the efficiency of your existing traffic, reducing costs."}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="scroll-animate flex flex-col rounded-[20px] bg-base-300 pt-1 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <h4 className="scroll-animate mt-6 mb-3 text-center font-heading text-2xl [font-variant-ligatures:none]">
                {card.title}
              </h4>
              <p
                className="scroll-animate mx-auto mb-6 max-w-xs text-center font-sans leading-relaxed text-base-content-muted"
                dangerouslySetInnerHTML={{ __html: card.desc }}
              ></p>
              <div className="scroll-animate mt-auto rounded-3xl bg-base-100">
                <img src={card.img} className="w-full rounded-2xl" alt="UI" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WhyShoptimity
