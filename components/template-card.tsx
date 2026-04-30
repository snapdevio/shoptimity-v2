"use client"

import { DownloadIcon, ExternalLinkIcon, LockIcon } from "lucide-react"
import Link from "next/link"
import { usePostHog } from "posthog-js/react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { TemplateImage } from "@/components/template-image"

interface Template {
  id: string
  title: string
  description: string | null
  img: string | null
  downloadLink: string | null
  previewLink: string | null
}

interface TemplateCardProps {
  template: Template
  hasActiveLicense: boolean
}

export function TemplateCard({
  template,
  hasActiveLicense,
}: TemplateCardProps) {
  const posthog = usePostHog()

  const handleDownload = () => {
    posthog.capture("template_download", {
      templateId: template.id,
      templateTitle: template.title,
    })
  }

  return (
    <Card className="group flex flex-col overflow-hidden border-none py-0 shadow-sm transition-all hover:shadow-md">
      <div className="relative aspect-16/10 w-full overflow-hidden">
        <TemplateImage
          src={template.img || ""}
          alt={template.title}
          className={cn(
            "group-hover:scale-110",
            !hasActiveLicense &&
              "opacity-90 grayscale-[0.5] transition-all group-hover:grayscale-0"
          )}
        />
      </div>
      <CardHeader className="flex-1 px-4 py-3">
        <CardTitle className="flex items-center justify-between text-xl leading-tight font-bold">
          {template.title}
        </CardTitle>
        <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-muted-foreground">
          {template.description}
        </p>
      </CardHeader>
      <CardFooter className="grid grid-cols-2 gap-2 p-4 pt-0">
        {hasActiveLicense ? (
          <a
            href={template.downloadLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDownload}
            className={cn(
              buttonVariants(),
              "cursor-pointer bg-orange-600 font-semibold text-white shadow-sm hover:bg-orange-700"
            )}
          >
            <DownloadIcon className="mr-2 size-4" />
            Download
          </a>
        ) : (
          <Link
            href="/plans"
            className={cn(
              buttonVariants(),
              "cursor-pointer bg-orange-600/10 font-semibold text-orange-600 shadow-none hover:bg-orange-600 hover:text-white"
            )}
          >
            <LockIcon className="mr-2 size-4" />
            Unlock
          </Link>
        )}
        <a
          href={template.previewLink || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "cursor-pointer",
            buttonVariants({
              variant: "outline",
              className:
                "border! border-slate-400! bg-white/90 backdrop-blur-sm transition-colors hover:bg-white/60",
            })
          )}
        >
          <ExternalLinkIcon className="mr-2 size-4" />
          Live Demo
        </a>
      </CardFooter>
    </Card>
  )
}
