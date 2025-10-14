import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground hover:shadow-neon hover:scale-105 active:scale-95",
        destructive: "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-neon hover:scale-105 active:scale-95",
        outline: "glass border-glass-border text-foreground hover:bg-glass-bg hover:shadow-glass hover:scale-105 active:scale-95",
        secondary: "bg-gradient-secondary text-secondary-foreground hover:shadow-neon hover:scale-105 active:scale-95",
        ghost: "text-foreground hover:bg-glass-bg hover:shadow-glass hover:scale-105 active:scale-95",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        neon: "bg-transparent border-2 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-background hover:shadow-neon-lg hover:scale-105 active:scale-95",
        glass: "glass border-glass-border text-foreground hover:bg-glass-bg hover:shadow-glass-lg hover:scale-105 active:scale-95",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-xl px-8 text-base",
        icon: "h-12 w-12 rounded-xl",
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        {/* Animated background effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.6 }}
        />
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
