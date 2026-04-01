import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm shadow-primary/20',
      secondary: 'bg-secondary text-foreground hover:bg-border/50',
      ghost: 'bg-transparent text-accent hover:bg-secondary hover:text-foreground',
      danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm shadow-danger/20',
      outline: 'bg-transparent border border-border text-foreground hover:bg-secondary',
      success: 'bg-success text-white hover:bg-success/90 shadow-sm shadow-success/20',
      warning: 'bg-warning text-black hover:bg-warning/90 shadow-sm shadow-warning/20',
    }
    const sizes = {
      sm: 'px-3 py-1.5 text-[13px] font-bold rounded-lg',
      md: 'px-4 py-2 text-sm font-bold rounded-lg',
      lg: 'px-6 py-3 text-base font-bold rounded-lg',
      icon: 'p-2 rounded-lg'
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none gap-2 whitespace-nowrap',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
