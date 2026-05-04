import { Metadata } from "next"
import { getActivePlans } from "@/actions/admin-plans"
import { getMetadata } from "@/lib/metadata"
import { Geist_Mono, Lexend } from "next/font/google"
import Script from "next/script"
import { BasePriceProvider } from "@/hooks/use-base-price"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PHProvider } from "@/components/posthog-provider"
import { Toaster } from "@/components/ui/sonner"

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export async function generateMetadata(): Promise<Metadata> {
  const plans = await getActivePlans()
  const basePrice =
    plans && plans.length > 0
      ? `$${(plans[0].finalPrice / 100).toFixed(0)}`
      : "$79"

  return getMetadata({
    title: `High-Converting Shopify Theme for Just ${basePrice}`,
    description: `Get Shoptimity – a premium Shopify theme designed to boost conversions, increase AOV, and eliminate app costs. Starting at just ${basePrice}. Build a high-performing store today.`,
    keywords: [
      "Shoptimity",
      `Shopify theme ${basePrice}`,
      "best Shopify theme",
      "high converting Shopify theme",
      "ecommerce theme",
      "Shopify premium theme",
      "Shopify store design",
      "conversion optimized theme",
    ],
  })
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isProduction =
    !process.env.NODE_ENV || process.env.NODE_ENV === "production"

  const plans = await getActivePlans()
  const { getActiveTemplates } = await import("@/actions/admin-templates")
  const templates = await getActiveTemplates()

  const initialBasePrice =
    plans && plans.length > 0
      ? `$${(plans[0].finalPrice / 100).toFixed(0)}`
      : "$79"
  const initialTrialDays =
    plans && plans.length > 0 ? plans[0].trialDays || 0 : 0
  const initialTemplateCount = templates ? templates.length : 0

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={cn("antialiased", fontMono.variable, lexend.variable)}
    >
      <body className="font-sans" suppressHydrationWarning>
        {isProduction && (
          <>
            {/* Google Tag (gtag.js) */}
            <Script
              async
              src="https://www.googletagmanager.com/gtag/js?id=G-NLM221VXBL"
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-NLM221VXBL');
              `}
            </Script>

            {/* Google tag (gtag.js) */}
            <Script
              async
              src="https://www.googletagmanager.com/gtag/js?id=AW-18007548365"
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'AW-18007548365');
              `}
            </Script>
            {/* Google Tag Manager */}
            <Script id="google-tag-manager" strategy="lazyOnload">
              {`
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','GTM-WV8WWJRP');
              `}
            </Script>

            {/* Meta Pixel Code */}
            <Script id="facebook-pixel" strategy="lazyOnload">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window,document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '1648748316292628');
                fbq('track', 'PageView');
              `}
            </Script>

            {/* Google Tag Manager (noscript) */}
            <noscript>
              <iframe
                src="https://www.googletagmanager.com/ns.html?id=GTM-WV8WWJRP"
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
              />
            </noscript>

            {/* Meta Pixel Code (noscript) */}
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src="https://www.facebook.com/tr?id=1648748316292628&ev=PageView&noscript=1"
              />
            </noscript>

            {/* Tawk.to Live Chat */}
            <Script id="tawk-to" strategy="lazyOnload">
              {`
                var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
                (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/69cdf4d2c4f63c1c36d26f12/1jl688lre';
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
                })();
              `}
            </Script>
          </>
        )}

        <ThemeProvider>
          <PHProvider>
            <BasePriceProvider
              initialBasePrice={initialBasePrice}
              initialTemplateCount={initialTemplateCount}
              initialTrialDays={initialTrialDays}
            >
              <TooltipProvider>
                {children}
                <Toaster position="top-right" richColors />
              </TooltipProvider>
            </BasePriceProvider>
          </PHProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
