import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import Navbar from "@/components/site/Navbar"
import {
  DiscordIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/site/BrandIcons"
import { getAppSession } from "@/lib/auth-session"
import { comparisonData } from "@/lib/comparison-data"

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAppSession()

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar isLoggedIn={!!session} />

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-base-100">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-5">
            <div className="col-span-2 sm:col-span-2 lg:col-span-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <img
                    src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT || ""}/assets/logo.svg`}
                    alt="Shoptimity Logo"
                    className="h-auto w-auto"
                  />
                  {/* <span className="inline text-2xl font-bold tracking-tight">
                    Shoptimity
                  </span> */}
                </div>
              </Link>
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                Streamlined Shopify license management. Manage your licenses,
                domains, and templates all in one place.
              </p>
              <div className="mt-6 flex items-center gap-5">
                <a
                  href="https://x.com/shoptimity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-all hover:scale-110 hover:text-foreground"
                >
                  <XIcon size={19} />
                </a>
                <a
                  href="https://www.facebook.com/share/1DTFzp25rE/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-all hover:scale-110 hover:text-foreground"
                >
                  <FacebookIcon size={22} />
                </a>
                <a
                  href="https://www.instagram.com/shoptimity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-all hover:scale-110 hover:text-foreground"
                >
                  <InstagramIcon size={22} />
                </a>
                <a
                  href="https://www.linkedin.com/in/shoptimity-llc-2342773b2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-all hover:scale-110 hover:text-foreground"
                >
                  <LinkedinIcon size={22} />
                </a>
                <a
                  href="https://www.youtube.com/@Shoptimity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-all hover:scale-110 hover:text-foreground"
                >
                  <YoutubeIcon size={22} />
                </a>
                <a
                  href="https://discord.gg/fRaJgZ3bM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-all hover:scale-110 hover:text-foreground"
                >
                  <DiscordIcon size={22} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-heading text-sm font-semibold">Product</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    href="/blogs"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Blogs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/plans"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/setup"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Setup Guide
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading text-sm font-semibold">
                Why Shoptimity
              </h4>
              <ul className="mt-3 space-y-2">
                {Object.entries(comparisonData).map(([key, data]) => (
                  <li key={key}>
                    <Link
                      href={`/compare/shoptimity-vs-${key}`}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {data.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-heading text-sm font-semibold">Legal</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    href="/faq"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/refund-policy"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Shoptimity. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
