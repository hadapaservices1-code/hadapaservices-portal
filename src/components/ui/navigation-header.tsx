"use client"

import { usePathname } from "next/navigation"
import { BackButton } from "@/components/ui/back-button"
import { cn } from "@/lib/utils"

interface NavigationHeaderProps {
  className?: string
  showBackButton?: boolean
  title?: string
  children?: React.ReactNode
}

export function NavigationHeader({ 
  className, 
  showBackButton = true, 
  title,
  children 
}: NavigationHeaderProps) {
  const pathname = usePathname()

  // Don't show back button on main dashboard or auth pages
  const shouldShowBackButton = showBackButton && 
    pathname !== '/dashboard' && 
    !pathname.startsWith('/auth') && 
    pathname !== '/login' && 
    pathname !== '/signup' &&
    pathname !== '/'

  // Get page title based on pathname
  const getPageTitle = () => {
    if (title) return title
    
    const pathTitles: Record<string, string> = {
      '/dashboard/tasks': 'My Tasks',
      '/dashboard/leave': 'Leave Management',
      '/dashboard/team-activity': 'Team Activity',
      '/dashboard/time-tracking': 'Time Tracking',
      '/dashboard/team': 'Team Management',
      '/dashboard/analytics': 'Analytics',
      '/dashboard/schedule': 'Schedule',
      '/dashboard/profile': 'Profile',
      '/dashboard/settings': 'Settings',
    }
    
    return pathTitles[pathname] || 'Dashboard'
  }

  return (
    <div className={cn(
      "flex items-center justify-between p-4 bg-white border-b border-gray-200",
      className
    )}>
      <div className="flex items-center gap-4">
        {shouldShowBackButton && <BackButton />}
        <h1 className="text-xl font-semibold text-gray-900">
          {getPageTitle()}
        </h1>
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}
