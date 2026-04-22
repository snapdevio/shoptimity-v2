import React from "react"

interface CaseStudyItem {
  badge: string
  value: string
  label: string
}

interface CaseStudyProps {
  headline?: string
  caseStudiesOverride?: CaseStudyItem[]
}

const CaseStudy: React.FC<CaseStudyProps> = ({
  headline,
  caseStudiesOverride,
}) => {
  const defaultCaseStudies: CaseStudyItem[] = [
    { badge: "CRC", value: "-20", label: "New customer" },
    { badge: "CRO", value: "+45", label: "Conversion Rate" },
    { badge: "ROAS", value: "+20", label: "Profitable Ad Speed" },
    { badge: "CAC", value: "-30", label: "Old Customer" },
    { badge: "LP", value: "+20", label: "LP > ATC%" },
  ]

  const caseStudies = caseStudiesOverride || defaultCaseStudies

  return (
    <section className="bg-[#0A0A0A] px-4 py-16 text-white md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="scroll-animate mb-12 md:mb-16">
          <span className="mb-6 inline-block rounded-full border border-base-content-muted px-4 py-1 font-sans text-[10px] font-bold tracking-widest uppercase">
            CASE STUDY
          </span>
          <h2 className="serif-heading text-gradient-orange-pink mb-3 font-heading text-4xl md:text-6xl">
            {headline || "Featured Case Study"}
          </h2>
          {!headline && (
            <p className="serif-heading max-w-full font-heading text-3xl opacity-80 md:max-w-[903px] md:text-4xl lg:text-[60px]">
              The Shoptimity
            </p>
          )}
        </div>

        <div className="mb-16 grid grid-cols-1 gap-6 md:mb-20 md:gap-12 lg:grid-cols-2">
          <div className="rounded-[20px] border border-gray-800 bg-[#99D2FB] p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:p-6">
            <div className="flex flex-wrap justify-center gap-[13px] xl:flex-nowrap">
              <img
                src="/assets/case-study-one.webp"
                className="w-24 rounded-xl sm:w-32 md:w-[150px] lg:w-[180px]"
                alt="case study featured images"
              />
              <img
                src="/assets/case-study-two.webp"
                className="w-24 rounded-xl sm:w-32 md:w-[150px] lg:w-[180px]"
                alt="case study featured images"
              />
              <img
                src="/assets/case-study-three.webp"
                className="w-24 rounded-xl sm:w-32 md:w-[150px] lg:w-[180px]"
                alt="case study featured images"
              />
            </div>
          </div>
          <div className="rounded-[20px] border border-gray-800 bg-[#99D2FB] p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:p-6">
            <div className="flex flex-wrap justify-center gap-[13px] xl:flex-nowrap">
              <img
                src="/assets/case-study-four.webp"
                className="w-24 rounded-xl sm:w-32 md:w-[150px] lg:w-[180px]"
                alt="case study featured images"
              />
              <img
                src="/assets/case-study-five.webp"
                className="w-24 rounded-xl sm:w-32 md:w-[150px] lg:w-[180px]"
                alt="case study featured images"
              />
              <img
                src="/assets/case-study-six.webp"
                className="w-24 rounded-xl sm:w-32 md:w-[150px] lg:w-[180px]"
                alt="case study featured images"
              />
            </div>
          </div>
        </div>

        <div className="relative z-20 mt-12 w-full overflow-hidden border-white/10 bg-black py-12">
          <div className="marquee-slower">
            <div className="flex divide-x divide-white/60">
              {[...caseStudies, ...caseStudies].map((study, idx) => (
                <div
                  key={idx}
                  className="flex min-w-[200px] flex-1 flex-col items-center px-12 text-center md:min-w-0 lg:px-28"
                >
                  <span className="mb-6 inline-block rounded-full bg-[#FFE500] px-3 py-1 font-sans text-[11px] leading-normal font-bold text-base-content uppercase">
                    {study.badge}
                  </span>
                  <div className="mb-2 font-heading text-[20px] leading-none text-white md:text-[25px]">
                    {study.value}
                    <span className="font-sans">%</span>
                  </div>
                  <div className="font-sans text-[12px] font-medium text-white/50">
                    {study.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CaseStudy
