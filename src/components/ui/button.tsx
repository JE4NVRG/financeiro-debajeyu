import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] active:transition-transform active:duration-100",
  {
    variants: {
      variant: {
        default:
          "bg-primary-600 text-white shadow-md hover:bg-primary-700 focus-visible:ring-primary-500 active:bg-primary-800",
        destructive:
          "bg-red-600 text-white shadow-md hover:bg-red-700 focus-visible:ring-red-500 active:bg-red-800",
        outline:
          "border border-border-color bg-bg-primary text-text-primary shadow-sm hover:bg-bg-secondary focus-visible:ring-primary-500",
        secondary:
          "bg-bg-secondary text-text-primary shadow-sm hover:bg-bg-primary focus-visible:ring-primary-500",
        ghost: 
          "text-text-primary hover:bg-bg-secondary focus-visible:ring-primary-500",
        link: 
          "text-primary-600 underline-offset-4 hover:underline focus-visible:ring-primary-500",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm sm:h-9",
        sm: "h-9 px-3 text-xs sm:h-8",
        lg: "h-12 px-8 text-base sm:h-11",
        icon: "h-10 w-10 sm:h-9 sm:w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
