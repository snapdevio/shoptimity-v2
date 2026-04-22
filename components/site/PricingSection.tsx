"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getActivePlans } from "@/actions/admin-plans"
import { getActiveTemplates } from "@/actions/admin-templates"
import CTABadges from "./CTABadges"

interface License {
  id: number
  label: string
  save: string
  saveAmount: string
  price: string
  originalPrice: string
  badge: string
  unitPrice: string
  stripe_payment_link: string
  planId: string
  popular?: boolean
  bestValue?: boolean
  slots: number
  trialDays: number
}

interface PricingSectionProps {
  headline?: string
}

const PricingSection: React.FC<PricingSectionProps> = ({ headline }) => {
  const router = useRouter()
  const [selectedLicenseIndex, setSelectedLicenseIndex] = useState<number>(0)
  const [licenses, setLicenses] = useState<License[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const dbPlans = await getActivePlans()
      const dbTemplates = await getActiveTemplates()

      if (dbPlans && dbPlans.length > 0) {
        const mappedLicenses: License[] = dbPlans
          .slice(0, 3)
          .map((plan, idx) => {
            const discount = plan.regularPrice - plan.finalPrice
            const savePercent = Math.round((discount / plan.regularPrice) * 100)
            const unitPrice = plan.finalPrice / plan.slots

            return {
              id: idx,
              label: `${plan.slots} LICENSE${plan.slots > 1 ? "S" : ""}`,
              save: `${savePercent}%`,
              saveAmount: `$${(discount / 100).toFixed(0)}`,
              price: `$${(plan.finalPrice / 100).toFixed(0)}`,
              originalPrice: `$${(plan.regularPrice / 100).toFixed(0)}`,
              badge: `${plan.slots} License${plan.slots > 1 ? "s" : ""}`,
              unitPrice: `$${(unitPrice / 100).toFixed(2)}`,
              stripe_payment_link: plan.stripePaymentLink || "#",
              planId: plan.id,
              popular: idx === 1,
              bestValue: idx === 2,
              slots: plan.slots,
              trialDays: plan.trialDays || 0,
            }
          })
        setLicenses(mappedLicenses)
      }

      if (dbTemplates) {
        setTemplates(dbTemplates)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const current = licenses[selectedLicenseIndex] || licenses[0]

  if (!current) {
    return (
      <section
        id="pricing"
        className="relative flex min-h-[800px] items-center justify-center bg-base-100 py-16 md:py-24"
      >
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary"></div>
      </section>
    )
  }

  const buyLicense = () => {
    router.push(
      `/api/checkout?planId=${current.planId}&quantity=${current.slots}`
    )
  }

  return (
    <section className="relative bg-base-100 py-16 md:py-24" id="pricing">
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="scroll-animate relative h-auto justify-center rounded-[38px] border p-2 shadow-[0_10px_50px_rgba(0,0,0,0.05)] lg:sticky lg:top-[120px] lg:p-6">
            <div className="relative z-0 mx-auto h-full w-full rounded-[28px]">
              <img
                src="/assets/pricing-image.webp"
                className="h-full w-full rounded-[28px] object-contain drop-shadow-2xl"
                alt="Shoptimity Mockup"
              />
            </div>
          </div>

          <div className="scroll-animate flex flex-col">
            <h2 className="mb-2 font-heading text-[32px] leading-tight text-base-content md:text-[40px]">
              {headline || "Shoptimity Shopify Theme"}
            </h2>
            <div className="mb-4 flex items-center gap-3 font-sans">
              <div className="flex items-baseline gap-3">
                <span className="text-[40px] font-bold tracking-tight text-base-content md:text-[52px]">
                  {current.price}
                </span>
                <span className="text-[20px] font-medium text-base-content-muted line-through md:text-[24px]">
                  {current.originalPrice}
                </span>
              </div>
              <span className="ml-2 rounded-full bg-primary px-3 py-1 text-[14px] font-bold text-primary-content">
                SAVE {current.save}
              </span>
            </div>

            {/* <div className="mb-8 font-sans">
              <div className="mb-3 flex items-center gap-3">
                <h3 className="text-2xl font-bold text-base-content">
                  Welcome Offer
                </h3>
                <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary-content uppercase">
                  NEW
                </span>
              </div>
              <p className="leading-relaxed text-base-content-muted">
                We’re new in the eCommerce space, and to welcome you to a
                streamlined landing page solution, here’s what we bring you:
              </p>
            </div>

            <div className="mb-8 rounded-[24px] border bg-base-300 p-6 font-sans shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-base-100">
                    <svg
                      className="h-5 w-5 text-base-content-muted"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                      />
                    </svg>
                  </div>
                  <span className="font-bold text-base-content">
                    {templates.length} Template Options
                  </span>
                </div>
                <span className="text-lg font-bold text-[#10B981]">
                  FREE{" "}
                  <span className="text-xs font-normal text-base-content-muted line-through">
                    {licenses[0]?.price || "$79"}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                {templates.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 text-[13px] font-medium text-base-content-muted"
                  >
                    <svg
                      className="h-4 w-4 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Free {t.title} Template
                  </div>
                ))}
              </div>
            </div> */}

            <div className="mb-10 font-sans">
              <div className="mb-2 flex items-center justify-between gap-2 sm:justify-start sm:gap-4">
                <h4 className="text-[20px] font-bold tracking-tight whitespace-nowrap text-base-content sm:text-[24px]">
                  Choose your amount
                </h4>
                <div className="shrink-0 rounded-xl border border-[#FFD9CD] bg-base-200 px-3 py-1.5 text-sm font-normal tracking-tight whitespace-nowrap text-primary">
                  {current.badge}
                </div>
              </div>

              <div className="mb-8 flex items-center gap-2">
                <div className="mr-2 flex items-center gap-1.5">
                  <span
                    className={`h-3 w-3 rounded-full transition-colors duration-300 ${selectedLicenseIndex >= 0 ? "bg-primary" : "bg-base-200"}`}
                  ></span>
                  <span
                    className={`h-3 w-3 rounded-full transition-colors duration-300 ${selectedLicenseIndex >= 1 ? "bg-primary" : "bg-base-200"}`}
                  ></span>
                  <span
                    className={`h-3 w-3 rounded-full transition-colors duration-300 ${selectedLicenseIndex >= 2 ? "bg-primary" : "bg-base-200"}`}
                  ></span>
                </div>
                <span className="text-[20px] font-bold tracking-tight text-base-content">
                  {current.unitPrice}
                </span>
                <span className="ml-1 text-[15px] font-medium text-base-content-muted">
                  per license
                </span>
              </div>

              <div className="space-y-4">
                {licenses.map((license, idx) => (
                  <button
                    key={license.id}
                    onClick={() => setSelectedLicenseIndex(idx)}
                    className={`license-btn group relative flex w-full cursor-pointer items-center justify-between rounded-2xl border-2 p-4 transition-all duration-300 ${
                      selectedLicenseIndex === idx
                        ? "border-primary bg-primary/5"
                        : "bg-base-300 hover:bg-primary/10"
                    }`}
                  >
                    {license.popular && (
                      <div className="absolute -top-3 right-4 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-medium text-white shadow-lg">
                        MOST POPULAR
                      </div>
                    )}
                    {license.bestValue && (
                      <div className="absolute -top-3 right-4 rounded-full bg-purple-600 px-3 py-1 text-[10px] font-medium text-white shadow-lg">
                        BEST VALUE
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-left">
                      <div className="relative h-14 w-14">
                        <div className="absolute inset-0 -translate-x-1 -translate-y-1 rounded-xl border bg-base-300 shadow-lg"></div>
                        <div className="relative flex h-14 w-14 items-center justify-center rounded-xl border bg-base-300 shadow-sm">
                          <img
                            src={`/shoptimity-icon.png`}
                            className="h-8 w-8 opacity-80"
                            alt="Icon"
                          />
                        </div>
                        <div className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                          {license.slots}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base-content">
                            {license.label}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] text-white uppercase ${idx === 1 ? "bg-blue-600" : idx === 2 ? "bg-purple-600" : "bg-primary"}`}
                          >
                            Save {license.save}
                          </span>
                        </div>
                        <p className="text-[13px] font-medium text-base-content-muted">
                          You save {license.saveAmount}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[20px] leading-none font-bold text-base-content">
                        {license.price}
                      </div>
                      <div className="mt-1 text-[13px] leading-none font-medium text-base-content-muted line-through">
                        {license.originalPrice}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={buyLicense}
                className="group flex w-full cursor-pointer items-center justify-center gap-4 rounded-full bg-[#FD784E] bg-[linear-gradient(135deg,#FD784E_0%,#FD784E_60%,#E9643F_100%)] py-4 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(253,120,78,0.35)]"
              >
                {current.trialDays == 0 && (
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-base-300/10">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </span>
                )}
                <span
                  className={`font-sans text-[16px] font-bold tracking-wider md:text-[20px] ${current.trialDays == 0 ? "capitalize" : "uppercase"}`}
                >
                  {current.trialDays > 0 ? "Start Free Trial Now" : "BUY NOW"}
                </span>
              </button>
              <CTABadges
                trialDays={current.trialDays}
                className="items-center justify-center"
              />
            </div>
          </div>
        </div>

        {/* Setup Roadmap Section - Full Width */}
        <div className="mt-10 rounded-[48px] border bg-base-200/50 p-4 shadow-sm backdrop-blur-sm sm:p-8 md:p-12">
          <div className="mb-12 text-center">
            <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-[14px] font-bold tracking-wider text-primary uppercase">
              Easy Setup
            </span>
            <h3 className="font-heading text-[32px] font-bold text-base-content md:text-[40px]">
              Setup in under 5 minutes
            </h3>
            <p className="mt-4 text-base-content-muted">
              Everything you need to launch your high-converting Shopify store
              instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Select Plan",
                desc: "Choose licenses & checkout via secure Stripe payment.",
              },
              {
                step: "02",
                title: "Access Dashboard",
                desc: "Get magic link, select your templates & download zip files.",
              },
              {
                step: "03",
                title: "Link Store",
                desc: "Add your Shopify domain to assign your license slot.",
              },
              {
                step: "04",
                title: "Go Live",
                desc: "Upload theme on Shopify & start increasing your conversion.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="group relative rounded-3xl bg-white p-6 transition-all duration-300 hover:-translate-y-2 hover:bg-base-100 hover:shadow-xl"
              >
                {/* Connector Arrow for Desktop */}
                {idx < 3 && (
                  <div className="absolute top-12 left-[70%] z-0 hidden w-full lg:block">
                    <svg
                      className="w-[50%] text-primary/40"
                      viewBox="0 0 100 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M0 10H85M85 10L77 4M85 10L77 16"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="6 8"
                        className="animate-flow"
                      />
                    </svg>
                  </div>
                )}

                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-primary/20 bg-base-100 font-sans text-[18px] font-bold text-primary transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-white">
                  {item.step}
                </div>

                <div className="flex flex-col">
                  <h4 className="mb-2 font-sans text-[18px] font-bold text-base-content transition-colors duration-300 group-hover:text-primary">
                    {item.title}
                  </h4>
                  <p className="text-[14px] leading-relaxed font-medium text-base-content-muted">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 rounded-full bg-base-300/80 px-6 py-3">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-primary"></span>
              <p className="text-[14px] font-semibold text-base-content">
                Need more info? Read the full{" "}
                <a
                  href="/setup"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Setup Guide
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PricingSection
