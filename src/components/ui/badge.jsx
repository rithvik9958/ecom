import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
  default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs",
  secondary: "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "border-red-500/20 bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25",
  success: "border-emerald-500/20 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25",
  warning: "border-amber-500/20 bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25",
  info: "border-sky-500/20 bg-sky-500/15 text-sky-600 dark:text-sky-400 hover:bg-sky-500/25",
  outline: "border-border text-foreground bg-transparent hover:bg-muted/50",
}

function Badge({ className, variant = "default", ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
