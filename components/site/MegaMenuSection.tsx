import React from "react"

interface MenuCard {
  title: string
  desc: string
  img: string
  fullWidth?: boolean
}

const MegaMenuSection: React.FC = () => {
  const cards: MenuCard[] = [
    {
      title: "Collection Hover",
      desc: "Showcase product details instantly with interactive hover effects—giving customers a quick, engaging preview without leaving the page.",
      img: "/assets/collection-hover.webp",
    },
    {
      title: "Slider Content Image",
      desc: "Interactive image sliders designed to present content beautifully—making exploration smooth, fast, and visually compelling.",
      img: "/assets/slider-content.webp",
    },
    {
      title: "Review Grids",
      desc: "Showcase customer reviews in a smooth slider—building trust and helping shoppers make confident decisions.",
      img: "/assets/review-slider.webp",
      fullWidth: true,
    },
  ]

  return (
    <section className="bg-base-100 px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center md:mb-16">
          <span className="scroll-animate mb-[10px] inline-block rounded-full border border-base-content/20 px-4 py-1.5 font-sans text-[10px] font-bold tracking-widest">
            Made for Conversions
          </span>

          <h2 className="scroll-animate serif-heading font-heading text-[32px] lg:text-6xl">
            Designed to Impress,{" "}
            <span className="text-gradient-orange-pink">Built to Convert</span>
          </h2>
        </div>

        <div className="scroll-animate grid gap-[30px] md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className={`scroll-animate rounded-3xl bg-base-300 p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                card.fullWidth
                  ? "mx-auto w-full max-w-[420px] md:col-span-2 lg:col-span-1"
                  : ""
              }`}
            >
              <h4 className="mb-4 font-heading text-[24px] font-medium">
                {card.title}
              </h4>

              <div className="mb-6 flex justify-center">
                <img
                  src={card.img}
                  alt={card.title}
                  className="w-full max-w-[320px] object-contain"
                />
              </div>

              <p className="font-sans leading-relaxed text-base-content-muted">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default MegaMenuSection
