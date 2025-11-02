import * as React from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles with responsive sizing for touch
          "flex w-full rounded-md border border-border-color bg-bg-primary px-3 py-3",
          // Mobile-first approach - larger touch targets and text
          "min-h-[120px] text-base sm:min-h-[80px] sm:py-2 sm:text-sm",
          // Theme-aware colors
          "text-text-primary placeholder:text-text-secondary",
          // Focus and interaction states
          "shadow-sm transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
          "hover:border-primary-300 focus:border-primary-500",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-bg-secondary",
          // Resize behavior
          "resize-y",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };