"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface OfferBarProps {
  basePrice?: string
}

const OfferBar: React.FC<OfferBarProps> = ({ basePrice = "$1" }) => {
  return (
    <div className="w-full bg-primary">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-1 sm:gap-4 sm:px-6 lg:px-8">
        <Image
          src="/assets/featured-shopify-white-logo.webp"
          alt="Shopify"
          width={300}
          height={120}
          className="h-12 w-auto object-contain sm:h-10"
        />
        <p className="text-sm font-medium text-primary-foreground sm:text-[15px]">
          <span className="hidden sm:inline">
            Start a free trial and enjoy 3 months of Shopify for {basePrice}
            /month on select plans.
          </span>
        </p>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="ms-2 rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 hover:text-primary"
        >
          <Link
            href="https://shopify.pxf.io/c/2789899/1101159/13624"
            className="inline-flex items-center gap-1.5"
          >
            Start Free Trial
            <ArrowRight className="ms-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default OfferBar
