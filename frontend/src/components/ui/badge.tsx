import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { badgeVariants } from "./badge-variants"

const Badge = React.forwardRef<
  HTMLElement,
  React.ComponentProps<"span"> &
    VariantProps<typeof badgeVariants> & { asChild?: boolean }
>(({ className, variant, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      ref={ref}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }
export type { BadgeProps }

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }
