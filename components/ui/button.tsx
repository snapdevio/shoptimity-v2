import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"

export interface ButtonProps
  extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const { children, ...rest } = props

  return (
    <ButtonPrimitive
      data-slot="button"
      render={asChild ? (children as React.ReactElement) : undefined}
      nativeButton={asChild ? false : undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...rest}
    >
      {!asChild && children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
