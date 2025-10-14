"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  className?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  fallbackPath?: string
  showText?: boolean
}

export function BackButton({ 
  className, 
  variant = "outline", 
  size = "default",
  fallbackPath = "/dashboard",
  showText = true
}: BackButtonProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleBack = () => {
    // Check if there's browser history to go back to
    if (window.history.length > 1) {
      // Check if we can go back to a different page
      const referrer = document.referrer
      const currentOrigin = window.location.origin
      
      // If referrer exists and is from the same origin, go back
      if (referrer && referrer.startsWith(currentOrigin)) {
        router.back()
        return
      }
    }
    
    // Fallback logic based on current path
    if (pathname.startsWith('/dashboard/')) {
      // If we're in a dashboard sub-page, go to main dashboard
      if (pathname !== '/dashboard') {
        router.push('/dashboard')
        return
      }
    }
    
    // If we're on auth pages, go to dashboard
    if (pathname.startsWith('/auth') || pathname === '/login' || pathname === '/signup') {
      router.push('/dashboard')
      return
    }
    
    // Default fallback
    router.push(fallbackPath)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={cn("flex items-center gap-2", className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {showText && "Back"}
    </Button>
  )
}
