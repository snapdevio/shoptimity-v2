import React from "react"

interface BuiltItem {
  img: string
  title: string
  desc: string
  center?: boolean
}

interface BuiltForProsProps {
  headline?: React.ReactNode
  itemsOverride?: BuiltItem[]
}

const BuiltForPros: React.FC<BuiltForProsProps> = ({
  headline,
  itemsOverride,
}) => {
  const defaultItems: BuiltItem[] = [
    {
      img: "/assets/handshake.png",
      title: "12,000+ Happy Customers",
      desc: "We grow with you — value-first mindset that benefits everyone.",
    },
    {
      img: "/assets/shopify.png",
      title: "Trusted Shopify Partner",
      desc: "4.9⭐ Trustpilot & 5⭐ Shopify reviews prove our quality.",
    },
    {
      img: "/assets/livechat.png",
      title: "Top-rated Support",
      desc: "Dedicated help & resources whenever you need them.",
      center: true,
    },
  ]

  const items = itemsOverride || defaultItems

  return (
    <section className="bg-base-300 py-10 md:py-20">
      <div className="scroll-animate mb-16 px-4 text-center">
        {headline || (
          <>
            <h2 className="mb-2 font-heading text-[32px] text-base-content md:text-6xl">
              Shoptimity is Built
            </h2>
            <h2 className="text-gradient-orange-pink font-heading text-[32px] md:text-6xl">
              for Professionals by Professionals
            </h2>
          </>
        )}
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`scroll-animate flex flex-col items-center text-center ${item.center ? "md:col-span-2 lg:col-span-1" : ""}`}
          >
            <img src={item.img} className="mb-6 w-[180px]" alt={item.title} />
            <h6 className="mb-4 font-heading text-xl font-medium md:text-2xl">
              {item.title}
            </h6>
            <p className="max-w-[330px] font-sans text-base-content-muted">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default BuiltForPros
