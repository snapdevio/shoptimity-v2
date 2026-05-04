import { Metadata } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://shoptimity.com"
const DEFAULT_OG_IMAGE = `${BASE_URL}/assets/og.png`

export type MetadataInput = {
  title: string
  description: string
  pathname?: string
  image?: string
  robots?: Metadata["robots"]
  keywords?: string[]
}

export function getMetadata({
  title,
  description,
  pathname,
  image = DEFAULT_OG_IMAGE,
  robots,
  keywords,
}: MetadataInput): Metadata {
  const url = pathname ? new URL(pathname, BASE_URL).toString() : BASE_URL

  return {
    metadataBase: new URL(BASE_URL),
    title: title
      ? {
          absolute: `${title} | Shoptimity`,
          template: "%s | Shoptimity",
        }
      : {
          default: "Shoptimity",
          template: "%s | Shoptimity",
        },
    description,
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: "Shoptimity",
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@shoptimity",
    },
    alternates: {
      canonical: url,
    },
    icons: {
      icon: [
        { url: "/shoptimity-favicon.ico" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
        { url: "/favicon-128.png", sizes: "128x128", type: "image/png" },
      ],
      shortcut: "/favicon-128.png",
      apple: "/favicon-180.png",
    },
    robots: robots || {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  }
}
