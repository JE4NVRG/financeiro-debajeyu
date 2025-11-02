import * as React from "react"

import { cn } from "../../lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles with responsive height for touch
          "flex w-full rounded-md border border-border-color bg-bg-primary px-3 py-2",
          // Mobile-first approach - larger touch targets
          "h-12 text-base sm:h-10 sm:text-sm",
          // Theme-aware colors
          "text-text-primary placeholder:text-text-secondary",
          // Focus and interaction states
          "shadow-sm transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
          "hover:border-primary-300 focus:border-primary-500",
          // File input styling
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-bg-secondary",
          // Active state for better touch feedback
          "active:scale-[0.98] active:transition-transform active:duration-100",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
