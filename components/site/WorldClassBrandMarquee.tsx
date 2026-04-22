import { getActiveTemplates } from "@/actions/admin-templates"
import { Star, TrendingUp } from "lucide-react"

interface Stat {
  label: string
  value: string
  sub: string
}

interface BrandCard {
  banner: string
  logo: string
  desc: string
  stats: Stat[]
  rating?: string
}

const PrecisionStar = ({ fill }: { fill: number }) => {
  const starPath =
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
  return (
    <div className="relative size-5">
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 fill-gray-200 text-gray-200"
        width="20"
        height="20"
      >
        <path d={starPath} />
      </svg>
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${Math.max(0, Math.min(100, fill * 100))}%` }}
      >
        <svg
          viewBox="0 0 24 24"
          className="fill-[#FF602E] text-[#FF602E]"
          width="20"
          height="20"
        >
          <path d={starPath} />
        </svg>
      </div>
    </div>
  )
}

const WorldClassBrandMarquee = async () => {
  const templates = await getActiveTemplates()

  // Map templates to BrandCard structure
  const dynamicCards: BrandCard[] = templates
    .filter((t) => (t.banner || t.img) && t.logo) // Use banner if available
    .map((t) => ({
      banner: t.banner || t.img!,
      logo: t.logo!,
      desc: t.shortDesc || t.description || "Premium Shopify Design",
      rating: t.startSize || "5.0",
      stats: [
        { label: "CRO", value: t.cro || "+0%", sub: "Conversion" },
        { label: "AOV", value: t.aov || "+0%", sub: "Order Value" },
        { label: "REV", value: t.rev || "+0%", sub: "Revenue" },
      ],
    }))

  const defaultCards: BrandCard[] = [
    {
      banner: "/assets/zenvyra-theme.webp",
      logo: "/assets/zenvyra-logo.webp",
      desc: "Sleek Fashion Design Built for Modern Conversions.",
      rating: "5.0",
      stats: [
        { label: "CRO", value: "+44%", sub: "Conversion" },
        { label: "AOV", value: "+5%", sub: "Order Value" },
        { label: "REV", value: "+70%", sub: "Revenue" },
      ],
    },
    {
      banner: "/assets/kidzo-theme.webp",
      logo: "/assets/kidzo-logo.webp",
      desc: "Fun & Playful Toy Experience Design Layout",
      rating: "4.8",
      stats: [
        { label: "CRO", value: "+51%", sub: "Conversion" },
        { label: "AOV", value: "+8%", sub: "Order Value" },
        { label: "REV", value: "+83%", sub: "Revenue" },
      ],
    },
    {
      banner: "/assets/pawzone-theme.webp",
      logo: "/assets/pawzone-logo.webp",
      desc: "Clean & Friendly Pet Experience Shopping Layout",
      rating: "4.9",
      stats: [
        { label: "CRO", value: "+49%", sub: "Conversion" },
        { label: "AOV", value: "+6%", sub: "Order Value" },
        { label: "REV", value: "+68%", sub: "Revenue" },
      ],
    },
  ]

  const displayCards = dynamicCards.length > 0 ? dynamicCards : defaultCards

  return (
    <section className="overflow-hidden bg-base-300 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-full">
        <h2 className="scroll-animate mb-8 text-center font-heading text-[38px] md:mb-16 md:text-6xl">
          World Class Brand{" "}
          <span className="bg-gradient-to-r from-primary to-[#FF7DD3] bg-clip-text text-transparent">
            Rely On Us
          </span>
        </h2>

        <div className="marquee font-sans">
          <div className="flex">
            {[...displayCards, ...displayCards, ...displayCards].map(
              (card, idx) => (
                <div
                  key={idx}
                  className="mr-6 flex w-[85vw] flex-shrink-0 snap-center flex-col rounded-xl border bg-base-100 p-5 shadow-sm md:w-[50vw] lg:w-[31vw]"
                >
                  <div className="mb-8 flex justify-center rounded-3xl bg-primary/10">
                    <img
                      src={card.banner}
                      className="aspect-video overflow-hidden rounded-xl object-cover"
                      alt="Product"
                    />
                  </div>
                  <div className="mb-4 flex flex-col items-center justify-center gap-2 text-center">
                    <img
                      src={card.logo}
                      className="h-10 w-[6rem] object-contain lg:w-[12rem]"
                      alt="Brand Logo"
                    />
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => {
                          const score = Number(card.rating || 5)
                          const fill = Math.max(0, Math.min(1, score - (s - 1)))
                          return <PrecisionStar key={s} fill={fill} />
                        })}
                      </div>
                    </div>
                  </div>
                  <p className="mb-6 line-clamp-2 min-h-[40px] text-center text-sm text-base-content-muted">
                    {card.desc}
                  </p>
                  <div className="mt-auto grid grid-cols-3 gap-4 border-t pt-4 text-center">
                    {card.stats.map((stat, sIdx) => (
                      <div key={sIdx}>
                        <div className="text-[10px]">{stat.label}</div>
                        <div className="text-2xl">{stat.value}</div>
                        <div className="text-[10px]">{stat.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default WorldClassBrandMarquee
