import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  HelpCircle,
  MessageCircle,
  Settings,
  CreditCard,
  Sparkles,
  ArrowRight,
} from "lucide-react"

export const metadata = {
  title: "Review App FAQ | Shoptimity",
  description:
    "Frequently Asked Questions for the Shoptimity Review App. Get help with setup, customization, and billing.",
  alternates: {
    canonical: "https://shoptimity.com/review-app/faq",
  },
}

const faqs = [
  {
    category: "General",
    icon: HelpCircle,
    color: "text-[#ff602e]",
    bgColor: "bg-orange-50",
    questions: [
      {
        q: "How do I install Shoptimity on my store?",
        a: "Installing Shoptimity is easy! Just click the 'Install' button in the Shopify App Store, follow the prompts to authorize the app, and you'll be guided through the setup process in your dashboard.",
      },
      {
        q: "Does Shoptimity support multiple languages?",
        a: "Absolutely. Shoptimity is built with internationalization in mind and supports multiple languages to help you reach customers worldwide.",
      },
      {
        q: "How does Shoptimity handle customer data?",
        a: "We take data privacy seriously. Shoptimity is GDPR and CCPA compliant. We only collect the necessary customer data required to send review requests and display reviews on your store. Your data is encrypted and stored securely.",
      },
    ],
  },
  {
    category: "Features",
    icon: Sparkles,
    color: "text-[#ff6fb5]",
    bgColor: "bg-pink-50",
    questions: [
      {
        q: "Can I customize the look of the review widgets?",
        a: "Yes, you can! Our 'Theme Settings' and 'Widget' configuration pages allow you to change colors, fonts, and layouts to match your brand's unique style.",
      },
      {
        q: "Does Shoptimity support photo and video reviews?",
        a: "Yes! High-quality social proof is essential. Customers can easily upload photos and videos directly from their mobile devices or desktop when submitting a review, which can then be displayed in premium galleries on your product pages.",
      },
      {
        q: "Can I automate review request emails?",
        a: "Absolutely. You can set up automated email sequences that trigger after a customer makes a purchase. You can customize the timing, subject lines, and content of these emails to maximize your review collection rate.",
      },
      {
        q: "Can I offer discounts in exchange for reviews?",
        a: "Yes, Shoptimity allows you to automatically generate and send unique discount codes to customers after they leave a review, incentivizing them to share their experience and come back for more purchases.",
      },
    ],
  },
  {
    category: "SEO & Growth",
    icon: ArrowRight,
    color: "text-green-600",
    bgColor: "bg-green-50",
    questions: [
      {
        q: "How does it help with Google Search (SEO)?",
        a: "Shoptimity automatically adds JSON-LD schema markup to your product pages. This helps search engines like Google display 'star ratings' in search results (Rich Snippets), which can significantly improve your click-through rate.",
      },
      {
        q: "Is there a Google Shopping integration?",
        a: "Yes, our premium plans include a Google Shopping feed that syndicates your product reviews directly to your Google Shopping ads, helping you stand out from competitors and build trust before a click even happens.",
      },
    ],
  },
  {
    category: "Support & Migration",
    icon: MessageCircle,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    questions: [
      {
        q: "How do I contact support if I have issues?",
        a: "You can reach our support team by emailing support@shoptimity.com or by using the 'Chat with us' button in the app dashboard.",
      },
      {
        q: "Can I migrate reviews from my current app?",
        a: "Yes! We make migration painless. You can import your existing reviews via CSV from Judge.me, Loox, Yotpo, or the Shopify Reviews app. Our support team is also available to handle custom migrations for you for free.",
      },
    ],
  },
]

export default function ReviewAppFaqPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-base-100 pt-32 pb-24">
      {/* Background blobs */}
      <div className="absolute -top-40 -left-20 h-[500px] w-[500px] shrink-0 rounded-full bg-gradient-to-br from-[#ff602e]/5 to-transparent opacity-50 blur-3xl" />
      <div className="absolute right-0 bottom-0 h-[400px] w-[400px] shrink-0 rounded-full bg-gradient-to-tl from-[#ff6fb5]/5 to-transparent opacity-50 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-20 text-center">
          <div className="mb-6 inline-flex animate-in items-center gap-2 rounded-full border border-black/5 bg-white/60 px-4 py-1.5 text-xs font-bold tracking-widest text-[#ff602e] uppercase backdrop-blur-md duration-500 fade-in slide-in-from-bottom-3">
            Support Center
          </div>
          <h1 className="mb-8 animate-in font-heading text-5xl leading-[1.1] font-bold tracking-tight text-[#1a1a1a] duration-700 fade-in slide-in-from-bottom-4 md:text-7xl">
            <span className="mb-2 block font-sans text-xl font-normal text-muted-foreground italic">
              Got questions?
            </span>
            The{" "}
            <span className="text-gradient-orange-pink">Review App FAQ</span>
          </h1>
          <p className="mx-auto max-w-2xl animate-in text-xl text-muted-foreground duration-1000 slide-in-from-bottom-5 fade-in">
            Everything you need to know about setting up and scaling your
            store's social proof with Shoptimity.
          </p>
        </div>

        <div className="animate-in space-y-16 duration-1000 fade-in slide-in-from-bottom-8">
          {faqs.map((group, groupIdx) => (
            <div key={groupIdx} className="group relative">
              <div className="mb-8 flex items-center gap-4">
                <div
                  className={`h-14 w-14 rounded-2xl ${group.bgColor} flex items-center justify-center ${group.color} shadow-sm transition-transform duration-500 group-hover:scale-110`}
                >
                  <group.icon className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="font-heading text-3xl font-bold text-[#1a1a1a]">
                    {group.category}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Common questions about {group.category.toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white bg-white/80 p-2 shadow-xl shadow-black/5 backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:shadow-black/[0.07]">
                <Accordion className="w-full">
                  {group.questions.map((faq, idx) => (
                    <AccordionItem
                      key={idx}
                      value={`item-${groupIdx}-${idx}`}
                      className="rounded-2xl border-none px-6 transition-colors hover:bg-black/[0.02]"
                    >
                      <AccordionTrigger className="group py-6 text-left text-lg font-semibold text-[#1a1a1a] hover:no-underline">
                        <span className="flex-1 pr-4">{faq.q}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-8 pl-0 text-base leading-relaxed text-muted-foreground">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          ))}
        </div>

        {/* CTA section */}
        <div className="group relative mt-24 overflow-hidden rounded-[40px] bg-[#1a1a1a] p-8 text-center md:p-16">
          <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff602e]/20 blur-3xl transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#ff6fb5]/20 blur-3xl transition-transform duration-700 group-hover:scale-110" />

          <div className="relative">
            <h2 className="mb-6 font-heading text-3xl leading-tight font-bold text-white md:text-5xl">
              Still have unanswered <br className="hidden md:block" />{" "}
              questions?
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-white/60">
              Our support team is available 24/7 to help you with any technical
              or billing inquiries.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-white px-10 py-4 text-sm font-bold text-[#1a1a1a] shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                Let's Talk
                <MessageCircle className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Shoptimity LLC. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
