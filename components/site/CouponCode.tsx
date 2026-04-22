"use client"

import { useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function CouponCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const copyToClipboard = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setOpen(true)
        setTimeout(() => {
          setCopied(false)
          setOpen(false)
        }, 5000)
      }
    } catch (err) {
      console.error("Failed to copy code")
    }
  }

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger>
        <div
          role="button"
          tabIndex={0}
          onClick={copyToClipboard}
          onKeyDown={(e) => e.key === "Enter" && copyToClipboard()}
          className={cn(
            "flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed px-6 py-3 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95",
            copied
              ? "border-green-500 bg-green-50"
              : "border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10"
          )}
        >
          <div className="flex flex-col items-center gap-0">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground/60">
              Use Code
            </span>
            <span
              className={cn(
                "font-mono text-3xl font-bold tracking-tight transition-colors",
                copied ? "text-green-600" : "text-primary"
              )}
            >
              {code}
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="font-medium">
        {copied ? "Copied!" : "Click to copy"}
      </TooltipContent>
    </Tooltip>
  )
}
