import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "glass" | "neon" | "gradient"
    hover?: boolean
  }
>(({ className, variant = "default", hover = true, ...props }, ref) => {
  const cardVariants = {
    default: "glass border-glass-border shadow-glass-lg",
    glass: "glass border-glass-border shadow-glass-lg",
    neon: "bg-transparent border-2 border-neon-blue shadow-neon-lg",
    gradient: "bg-gradient-surface border-glass-border shadow-glass-lg",
  }

  return (
    <motion.div
      ref={ref}
      className={cn(
        "rounded-2xl text-card-foreground relative overflow-hidden",
        cardVariants[variant],
        hover && "hover:shadow-neon-lg hover:scale-105 transition-all duration-300",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      transition={{ duration: 0.3 }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative z-10">{props.children}</div>
    </motion.div>
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6", className)}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {...(props as any)}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    gradient?: boolean
  }
>(({ className, gradient = false, ...props }, ref) => (
  <motion.h3
    ref={ref}
    className={cn(
      "text-2xl font-bold leading-none tracking-tight",
      gradient && "gradient-text",
      className
    )}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {...(props as any)}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <motion.p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {...(props as any)}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn("p-6 pt-0", className)}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {...(props as any)}
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {...(props as any)}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }