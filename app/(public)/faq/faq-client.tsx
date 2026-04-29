"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"

interface FAQItemProps {
  question: string
  answer: React.ReactNode
  isOpen: boolean
  onToggle: () => void
}

const FAQItem: React.FC<FAQItemProps> = ({
  question,
  answer,
  isOpen,
  onToggle,
}) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number>(0)

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setHeight(contentRef.current.scrollHeight)
    } else {
      setHeight(0)
    }
  }, [isOpen])

  return (
    <div className="faq-item overflow-hidden rounded-2xl border border-border bg-base-300 transition-all duration-300 hover:shadow-lg">
      <button
        onClick={onToggle}
        className="group flex w-full cursor-pointer items-center justify-between p-6 text-left focus:outline-none md:p-8"
      >
        <span
          className={`font-sans text-[16px] font-medium text-base-content transition-colors duration-300 md:text-xl ${
            isOpen ? "text-primary" : "group-hover:text-primary"
          }`}
        >
          {question}
        </span>
        <div className="relative h-6 w-6 shrink-0">
          <span
            className={`absolute top-1/2 left-0 h-0.5 w-full translate-y-[-50%] rounded-full bg-base-content transition-colors duration-300 ${
              isOpen ? "bg-primary" : "group-hover:bg-primary"
            }`}
          ></span>
          <span
            className={`absolute top-0 left-1/2 h-full w-0.5 translate-x-[-50%] rounded-full bg-base-content transition-all duration-300 ${
              isOpen
                ? "scale-y-0 rotate-90 transform bg-primary opacity-0"
                : "group-hover:bg-primary"
            }`}
          ></span>
        </div>
      </button>
      <div
        style={{ maxHeight: `${height}px` }}
        className="faq-answer overflow-hidden transition-all duration-500 ease-in-out"
      >
        <div
          ref={contentRef}
          className="px-6 pb-8 font-sans text-[16px] leading-relaxed text-base-content-muted md:px-8 md:text-lg"
        >
          {answer}
        </div>
      </div>
    </div>
  )
}

export function FAQClient() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      category: "Product & Performance",
      items: [
        {
          question: "What makes Shoptimity different from other themes?",
          answer:
            "Shoptimity is engineered from the ground up with a mobile-first philosophy, using data from 7 & 8-figure brands. Unlike generic themes, we focus on actual conversion optimization and blistering performance out-of-the-box. We use native CSS and minimal JS to ensure your store stays fast even with many features enabled.",
        },
        {
          question: "Is Shoptimity easy to set up for beginners?",
          answer:
            'Absolutely. Our "3-step setup" process allows anyone to transfer their content and scale their store in minutes. You don\'t need any coding knowledge to achieve professional, high-converting results. We provide comprehensive documentation and support to help you every step of the way.',
        },
        {
          question: "How does Shoptimity help me eliminate monthly app costs?",
          answer:
            "Shoptimity is engineered with over 100+ built-in blocks and conversion features—like countdown timers, sticky add-to-cart, and product swatches—that normally require ten or more separate apps. Instead of paying multiple recurring subscriptions, Shoptimity provides everything in one streamlined platform, saving you hundreds of dollars each month and significantly improving your loading speed.",
        },
      ],
    },
    {
      category: "Licensing & Support",
      items: [
        {
          question: "Can I use Shoptimity on multiple stores?",
          answer:
            "Each license is valid for one Shopify store only. Both our Free and Pro plans include 1 license slot per account. If you want to use Shoptimity on additional stores, you’ll need to create a separate account for each store and purchase a license accordingly.",
        },
        {
          question: "Does the theme include updates?",
          answer:
            "Yes, we regularly release new features, performance improvements, and conversion-optimized blocks based on the latest e-commerce trends. All updates are included as part of your active subscription.",
        },
        {
          question: "What kind of support is included?",
          answer: (
            <div className="space-y-3 leading-relaxed">
              <div>
                Every Shoptimity plan comes with reliable, round-the-clock
                support to help you succeed.
              </div>

              <div>
                <strong>Free Plan:</strong> Includes email support for setup
                guidance, feature usage, and basic troubleshooting.
              </div>

              <div>
                <strong>Pro Plan:</strong> Includes everything in Free, plus
                priority assistance from a dedicated developer for faster
                resolutions, advanced configuration, and customizations.
              </div>

              <div>
                You can reach us via live chat, through our{" "}
                <Link
                  href="/contact"
                  className="cursor-pointer text-primary hover:underline"
                >
                  contact page
                </Link>
                , or via{" "}
                <a
                  href="mailto:support@shoptimity.com"
                  className="cursor-pointer text-primary hover:underline"
                >
                  email
                </a>
                .
              </div>
            </div>
          ),
        },
        {
          question: "How do I cancel my subscription?",
          answer:
            "You can cancel your subscription at any time directly through your Shoptimity dashboard. Simply navigate to the Billing page and click the Cancel Plan button. Access to premium features will remain active until the end of your current billing period.",
        },
        {
          question:
            "What happens to my connected domains if I cancel my subscription?",
          answer:
            "If you cancel your Pro subscription, your domain's premium license will be revoked at the end of the billing cycle. While your Shopify store will remain functional, all Pro-level features, templates, and performance optimizations will be deactivated. You can still use the Free Plan for basic theme functionality.",
        },
      ],
    },
    {
      category: "Technical Details",
      items: [
        {
          question:
            "Is the theme compatible with the latest Shopify Online Store 2.0?",
          answer:
            "Yes, Shoptimity is fully compatible with Online Store 2.0 (OS 2.0), utilizing sections everywhere, app blocks, and all the latest Shopify features to give you maximum flexibility.",
        },
        {
          question: "Will Shoptimity slow down my site as I add more blocks?",
          answer:
            "No. Unlike traditional themes that load everything at once, Shoptimity uses a modular architecture. Only the code required for the sections you use is prioritized, and we use advanced techniques like passive event listeners and optimized image loading to keep your performance scores high.",
        },
      ],
    },
  ]

  let globalCounter = 0

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div className="absolute top-0 left-1/2 -z-10 h-100 w-200 -translate-x-1/2 bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_70%)] opacity-[0.05]"></div>

        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-base-content sm:text-5xl">
            Questions? <span className="text-primary">Answered.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-base-content-muted sm:text-xl">
            Everything you need to know about Shoptimity, our licensing, and how
            we help you build high-converting Shopify stores.
          </p>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {faqs.map((category) => (
            <div key={category.category} className="mb-16 last:mb-0">
              <div className="mb-8 flex items-center gap-4">
                <h2 className="font-heading text-2xl font-bold text-base-content">
                  {category.category}
                </h2>
                <div className="h-0.5 flex-1 bg-border/50"></div>
              </div>
              <div className="space-y-4">
                {category.items.map((item) => {
                  const currentIdx = globalCounter++
                  return (
                    <FAQItem
                      key={currentIdx}
                      question={item.question}
                      answer={item.answer}
                      isOpen={openIndex === currentIdx}
                      onToggle={() =>
                        setOpenIndex(
                          openIndex === currentIdx ? null : currentIdx
                        )
                      }
                    />
                  )
                })}
              </div>
            </div>
          ))}

          {/* Still have questions? */}
          <div className="relative mt-24 overflow-hidden rounded-[40px] bg-base-content p-8 text-center sm:p-16">
            <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-20 blur-[80px]"></div>
            <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary opacity-10 blur-[80px]"></div>

            <div className="relative z-10">
              <h3 className="font-heading text-3xl font-bold text-primary-content md:text-4xl">
                Still have questions?
              </h3>
              <p className="mx-auto mt-6 max-w-lg text-primary-content/70 md:text-lg">
                Can&apos;t find the answer you&apos;re looking for? Reach out
                and we&apos;ll get back to you shortly.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex h-14 w-full cursor-pointer items-center justify-center rounded-full bg-primary px-10 text-lg font-semibold text-white transition-all hover:scale-105 hover:shadow-xl sm:w-auto"
                >
                  Get in Touch
                </Link>
                <Link
                  href="/plans"
                  className="inline-flex h-14 w-full cursor-pointer items-center justify-center rounded-full bg-white/10 px-10 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:w-auto"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
