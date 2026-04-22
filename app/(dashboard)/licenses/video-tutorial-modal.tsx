"use client"

import { HelpCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function VideoTutorialModal() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            title="Watch video tutorial"
            className="inline-flex items-center justify-center rounded-full text-muted-foreground ring-offset-background transition-all duration-200 hover:scale-110 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
          >
            <HelpCircle className="size-4" />
            <span className="sr-only">Video tutorial</span>
          </button>
        }
      />
      <DialogContent className="gap-0 overflow-hidden border-border/50 bg-background/80 p-0 shadow-2xl backdrop-blur-2xl sm:max-w-[800px]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <HelpCircle className="size-5 text-primary" />
            License Management Tutorial
          </DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video w-full bg-slate-900">
          <video
            className="absolute inset-0 h-full w-full"
            controls
            preload="metadata"
            src={
              process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT
                ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT}/video/step1.mp4`
                : ""
            }
            title="Licenses Management Tutorial"
          >
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="border-t border-border/50 bg-muted/30 p-4">
          <p className="text-center text-xs text-muted-foreground">
            Master your license management! Follow the steps above to connect
            and optimize your Shopify stores in seconds.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
