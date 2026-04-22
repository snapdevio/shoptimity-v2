import {
  Zap,
  Smartphone,
  Wallet,
  Layers,
  CodeXml,
  TrendingUp,
} from "lucide-react"

export default function WhyChooseUs({
  competitorName,
}: {
  competitorName?: string
}) {
  const cards = [
    {
      title: "Lightning Fast Speeds",
      description:
        "Built with clean code and an optimized architecture to ensure blazing-fast page loads that keep buyers from bouncing.",
      icon: <Zap className="h-7 w-7 text-orange-600" strokeWidth={1.5} />,
    },
    {
      title: "Mobile-First Experience",
      description:
        "With over 70% of traffic on phones, our interface is strictly optimized to give your buyers a smooth, native app-like feel.",
      icon: (
        <Smartphone className="h-7 w-7 text-orange-600" strokeWidth={1.5} />
      ),
    },
    {
      title: "Built-in Premium Features",
      description:
        "Comes fully loaded with built-in AOV boosters like quantity breaks and upsells—eliminating hefty monthly app fees.",
      icon: <Wallet className="h-7 w-7 text-orange-600" strokeWidth={1.5} />,
    },
    {
      title: "Pre-Built Niche Templates",
      description:
        "Get started in minutes instead of weeks. Select from our premium, highly tested storefront layouts built for specific industries.",
      icon: <Layers className="h-7 w-7 text-orange-600" strokeWidth={1.5} />,
    },
    {
      title: "No Coding Required",
      description:
        "Designed specifically for brand owners and marketers. Customize every pixel perfectly without ever touching a line of code.",
      icon: <CodeXml className="h-7 w-7 text-orange-600" strokeWidth={1.5} />,
    },
    {
      title: "Maximizes Conversions",
      description:
        "Every single UI element is rigorously tested to drastically improve checkout rates and turn visitors into high-paying customers.",
      icon: (
        <TrendingUp className="h-7 w-7 text-orange-600" strokeWidth={1.5} />
      ),
    },
  ]

  return (
    <section className="bg-gray-100/50">
      <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
        <h2 className="mb-10 text-center text-3xl font-medium tracking-tight text-gray-900 md:text-4xl">
          Why businesses choose Shoptimity
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <div
              key={index}
              className="flex flex-col gap-6 rounded-2xl bg-white p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05),0_10px_20px_-2px_rgba(0,0,0,0.04)] ring-1 ring-gray-100/50 transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
            >
              <div>{card.icon}</div>
              <div>
                <h3 className="mb-3 text-lg font-medium text-gray-900">
                  {card.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-gray-600">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
