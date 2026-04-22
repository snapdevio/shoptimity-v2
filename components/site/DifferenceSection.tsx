import React from "react"
import { cn } from "@/lib/utils"
interface FloatingImage {
  src: string
  className: string
  delay: string
}

interface DifferenceCard {
  title: string
  desc: string
  img: string
}

interface DifferenceSectionProps {
  headline?: string
  subheadline?: string
  centerTitle?: string
  centerDesc?: string
  cardsOverride?: DifferenceCard[]
}

const DifferenceSection: React.FC<DifferenceSectionProps> = ({
  headline,
  subheadline,
  centerTitle,
  centerDesc,
  cardsOverride,
}) => {
  const defaultCards: DifferenceCard[] = [
    {
      title: "Made for everyone",
      desc: "There is no one-size-fits-all solution — before Shoptimity. From fresh grads to advanced developers, everyone can stretch their creativity beyond their comfort zone.",
      img: "/assets/made-for-everyone.webp",
    },
    {
      title: "M-conversion done excellent",
      desc: "Shoptimity is built with mobile commerce in mind — every section is responsive and mobile-perfect by default.",
      img: "/assets/three-mobile.webp",
    },
  ]

  const cards = cardsOverride || defaultCards

  const floatingImages: FloatingImage[] = [
    {
      src: "/assets/shop-by-collection.webp",
      className: "w-[266px] h-[139px] ml-[270px] mt-[3px] rounded-[8px]",
      delay: "0s",
    },
    {
      src: "/assets/product-review.webp",
      className: "w-[82px] h-[151px] top-[231px] left-[168px] z-10",
      delay: "0.5s",
    },
    {
      src: "/assets/featured-collection.webp",
      className: "w-[370px] h-[143px] top-[13px] left-[1088px] rounded-[8px]",
      delay: "1s",
    },
    {
      src: "/assets/parallex-image.webp",
      className: "w-[270px] h-[150px] top-[272px] left-[1107px] rounded-[8px]",
      delay: "1.5s",
    },
    {
      src: "/assets/slider-content-image.webp",
      className: "w-[230px] h-[120px] top-[170px] left-[-9px] rounded-[8px]",
      delay: "2s",
    },
    {
      src: "/assets/college-images.webp",
      className: "w-[130px] h-[232px] top-[-51px] right-[329px] rounded-[8px]",
      delay: "2.5s",
    },
    {
      src: "/assets/custome-column.webp",
      className: "w-[281px] h-[140px] bottom-[35px] left-[-41px] rounded-[8px]",
      delay: "3s",
    },
    {
      src: "/assets/before-after-slider.webp",
      className: "w-[299px] h-[169px] top-[520px] left-[453px] rounded-[8px]",
      delay: "3.5s",
    },
    {
      src: "/assets/product-information.webp",
      className: "w-[290px] h-[145px] top-[533px] right-[55px] rounded-[8px]",
      delay: "4s",
    },
  ]

  return (
    <section className="bg-base-100 px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="scroll-animate mb-12 text-center md:mb-16">
          <h2 className="font-heading text-[36px] leading-tight text-base-content md:text-[42px] lg:text-[50px] xl:text-[60px]">
            {headline ? (
              <span dangerouslySetInnerHTML={{ __html: headline }}></span>
            ) : (
              <>
                What Makes{" "}
                <span className="text-gradient-orange-pink bg-clip-text text-transparent">
                  Shoptimity Different?
                </span>{" "}
                👏
              </>
            )}
          </h2>
          {subheadline && (
            <p className="mx-auto mt-4 max-w-2xl font-sans text-base-content-muted">
              {subheadline}
            </p>
          )}
        </div>

        {/* Pink Card */}
        <div className="scroll-animate relative mb-12 flex min-h-[380px] items-center justify-center overflow-hidden rounded-[28px] bg-base-200 md:min-h-[640px] md:rounded-[40px]">
          {/* Floating Images (Desktop only: 1280px+) */}
          <div className="pointer-events-none absolute inset-0 hidden xl:block">
            {floatingImages.map((img, idx) => (
              <img
                key={idx}
                src={img.src}
                className={cn("animate-zoom absolute", img.className)}
                style={{ animationDelay: img.delay }}
                alt="Floating decorative image"
              />
            ))}
          </div>

          {/* Floating Images (Tablet: 768px to 1279px) */}
          <div className="pointer-events-none absolute inset-0 hidden md:block xl:hidden">
            <img
              src="/assets/shop-by-collection.webp"
              className="animate-zoom absolute top-[-10px] left-[80px] w-[250px] rounded-[20px]"
              style={{ animationDelay: "0s" }}
              alt="Shop by collection"
            />
            <img
              src="/assets/featured-collection.webp"
              className="animate-zoom absolute top-[13px] right-[-80px] w-[230px] rounded-[8px]"
              style={{ animationDelay: "1s" }}
              alt="Featured collection"
            />
            <img
              src="/assets/parallex-image.webp"
              className="animate-zoom absolute top-[265px] w-[220px] rounded-[8px] md:left-[560px] lg:left-[804px]"
              style={{ animationDelay: "1.5s" }}
              alt="Parallax image"
            />
            <img
              src="/assets/slider-content-image.webp"
              className="animate-zoom absolute top-[220px] left-[-10px] h-[90px] w-[180px] rounded-[8px]"
              style={{ animationDelay: "2s" }}
              alt="Slider content image"
            />
            <img
              src="/assets/college-images.webp"
              className="animate-zoom absolute top-[-40px] right-[210px] w-[100px] rounded-[8px]"
              style={{ animationDelay: "2.5s" }}
              alt="College images"
            />
            <img
              src="/assets/custome-column.webp"
              className="animate-zoom absolute bottom-[70px] left-[-34px] w-[215px] rounded-[8px]"
              style={{ animationDelay: "3s" }}
              alt="Custom column"
            />
            <img
              src="/assets/before-after-slider.webp"
              className="animate-zoom absolute bottom-[-35px] w-[210px] rounded-[8px] md:left-[230px] lg:left-[320px]"
              style={{ animationDelay: "3.5s" }}
              alt="Before and after slider"
            />
            <img
              src="/assets/product-information.webp"
              className="animate-zoom absolute w-[210px] rounded-[8px] md:right-0 md:bottom-[50px]"
              style={{ animationDelay: "4s" }}
              alt="Product information"
            />
          </div>

          {/* Center Content */}
          <div className="scroll-animate relative z-10 w-full max-w-[520px] px-4 text-center sm:px-6">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-base-content">
              <img
                src={`/shoptimity-icon.png`}
                className="h-auto w-9"
                alt="Logo icon"
              />
            </div>
            <h3 className="mb-6 font-heading text-[32px] leading-[40px] font-medium tracking-[0.4px] text-base-content sm:text-[40px] sm:leading-[48px]">
              {centerTitle || "More flexible than flexibility"}
            </h3>
            <p className="font-sans leading-relaxed text-base-content-muted">
              {centerDesc ||
                "Shoptimity offers endless possibilities for customizations and granular control over settings so you can build a unique store quickly and easily."}
            </p>
          </div>
        </div>

        {/* Bottom Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="scroll-animate flex flex-col overflow-hidden rounded-2xl bg-base-300 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="scroll-animate flex-1 p-6 md:p-10">
                <h4 className="mb-4 font-heading text-2xl text-base-content md:text-3xl">
                  {card.title}
                </h4>
                <p className="mx-auto max-w-md font-sans leading-relaxed text-base-content-muted/80">
                  {card.desc}
                </p>
              </div>
              <img
                src={card.img}
                className={cn(
                  "scroll-animate h-[260px] w-full object-cover object-top md:h-[354px]",
                  card.title.toLowerCase().includes("mobile") &&
                    "object-contain"
                )}
                alt={card.title}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default DifferenceSection
