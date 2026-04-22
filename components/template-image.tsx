"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TemplateImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string
}

export function TemplateImage({
  src,
  alt,
  className,
  fallbackSrc = "/assets/placeholder-web.png",
  ...props
}: TemplateImageProps) {
  const [imgSrc, setImgSrc] = React.useState(src || fallbackSrc)

  React.useEffect(() => {
    setImgSrc(src || fallbackSrc)
  }, [src, fallbackSrc])

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      className={cn(
        "h-full w-full object-cover object-top transition-transform duration-700",
        className
      )}
      onError={() => {
        if (imgSrc !== fallbackSrc) {
          setImgSrc(fallbackSrc)
        }
      }}
    />
  )
}
