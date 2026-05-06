import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40",
          {
            "bg-primary text-white shadow-[0_2px_8px_-2px_rgba(200,98,46,0.4)] hover:bg-primary/90 active:scale-[0.98]": variant === "default",
            "bg-destructive/90 text-white shadow-sm hover:bg-destructive active:scale-[0.98]": variant === "destructive",
            "border border-border bg-transparent hover:bg-white/5 hover:border-border/80 text-foreground": variant === "outline",
            "bg-muted text-foreground/80 hover:bg-secondary hover:text-foreground": variant === "secondary",
            "hover:bg-muted hover:text-foreground text-muted-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline p-0 h-auto": variant === "link",
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-lg px-3 text-xs": size === "sm",
            "h-10 rounded-lg px-6": size === "lg",
            "h-9 w-9 p-0": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
