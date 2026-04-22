import React from "react"
import { getActiveTemplates } from "@/actions/admin-templates"

const BrandMarquee = async () => {
  const templates = await getActiveTemplates()

  // Get logos from active templates, filter out nulls/empty
  const dynamicLogos = templates
    .map((t) => t.logo)
    .filter((logo): logo is string => !!logo && logo.trim() !== "")

  const defaultBrands: string[] = [
    "/assets/pawzone-logo.webp",
    "/assets/zenvyra-logo.webp",
    "/assets/kidzo-logo.webp",
    "/assets/velmora-logo.webp",
    "/assets/fitcore-logo.webp",
  ]

  const brands = dynamicLogos.length > 0 ? dynamicLogos : defaultBrands

  return (
    <section className="overflow-hidden bg-base-100 py-8 md:py-12">
      <div className="scroll-animate mb-8 px-6 text-center font-sans md:mb-10">
        <p className="mx-auto max-w-3xl leading-relaxed font-medium">
          Join <span className="font-semibold text-primary">10,000+</span>{" "}
          successful brands choosing Shoptimity to build & grow their Shopify
          stores!
        </p>
      </div>

      <div className="scroll-animate relative w-full overflow-hidden">
        <div className="marquee">
          <div className="flex items-center gap-14 lg:gap-24">
            {[...brands, ...brands, ...brands].map((src, i) => (
              <img
                key={i}
                src={src}
                alt="Brand Logo"
                className="h-auto w-[6rem] object-contain lg:w-[12rem]"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default BrandMarquee
