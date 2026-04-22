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
    <div className="scroll-animate faq-item overflow-hidden rounded-2xl border bg-base-300 transition-all duration-300 hover:shadow-lg">
      <button
        onClick={onToggle}
        className="group flex w-full items-center justify-between p-6 text-left focus:outline-none md:p-8"
      >
        <span
          className={`font-sans text-[16px] text-base-content transition-colors duration-300 md:text-xl ${
            isOpen ? "text-primary" : "group-hover:text-primary"
          }`}
        >
          {question}
        </span>
        <div className="relative h-6 w-6 shrink-0">
          <span
            className={`absolute top-1/2 left-0 h-[2px] w-full translate-y-[-50%] rounded-full bg-base-content transition-colors duration-300 ${
              isOpen ? "bg-primary" : "group-hover:bg-primary"
            }`}
          ></span>
          <span
            className={`absolute top-0 left-1/2 h-full w-[2px] translate-x-[-50%] rounded-full bg-base-content transition-all duration-300 ${
              isOpen
                ? "scale-y-0 rotate-90 transform bg-primary"
                : "group-hover:bg-primary"
            }`}
          ></span>
        </div>
      </button>
      <div
        style={{ maxHeight: `${height}px` }}
        className="faq-answer overflow-hidden opacity-100 transition-all duration-500 ease-in-out"
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

interface FAQData {
  question: string
  answer: React.ReactNode
}

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs: FAQData[] = [
    {
      question: "What makes Shoptimity different from other themes?",
      answer:
        "Shoptimity is engineered from the ground up with a mobile-first philosophy, using data from 7 & 8-figure brands. Unlike generic themes, we focus on actual conversion optimization and blistering performance out-of-the-box.",
    },
    {
      question: "Is Shoptimity easy to set up for beginners?",
      answer:
        'Absolutely. Our "3-step setup" process allows anyone to transfer their content and scale their store in minutes. You don\'t need any coding knowledge to achieve professional, high-converting results.',
    },
    {
      question: "Does the theme include free updates?",
      answer:
        "Yes, we regularly release new features, performance improvements, and conversion-optimized blocks based on the latest e-commerce trends.",
    },
    {
      question: "Can I use Shoptimity on multiple stores?",
      answer:
        "This depends on the license you purchase. We offer 1, 2, and 3 license options. Each license is valid for a single Shopify store. If you manage multiple brands, our 3-license bundle offers the best value.",
    },
    {
      question: "How does Shoptimity help me eliminate monthly app costs?",
      answer:
        "Shoptimity is engineered with 80+ built-in blocks and conversion features—like countdown timers and sticky ATC—that normally require expensive monthly subscriptions. By using our native features, you save hundreds of dollars and improve loading speed.",
    },
    {
      question: "What kind of support is included?",
      answer: (
        <>
          Every Shoptimity purchase comes with dedicated, round-the-clock
          support. Whether you need help with technical on-boarding, feature
          configuration, or minor styling adjustments, our expert team is here
          to ensure your success. You can reach us instantly via live chat,
          through our{" "}
          <Link href="/contact" className="text-primary hover:underline">
            contact page
          </Link>
          , or via{" "}
          <a
            href="mailto:support@shoptimity.com"
            className="text-primary hover:underline"
          >
            email
          </a>
          .
        </>
      ),
    },
  ]

  return (
    <section id="faq" className="overflow-hidden bg-base-100 py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-16 text-center">
          <h2 className="scroll-animate mb-4 font-heading text-[32px] text-base-content md:text-5xl lg:text-6xl">
            Your Questions, Answered
          </h2>
          <p className="scroll-animate mx-auto max-w-2xl font-sans text-base-content-muted">
            Everything you need to know about the theme and our licenses.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <FAQItem
              key={idx}
              {...faq}
              isOpen={openIndex === idx}
              onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ
