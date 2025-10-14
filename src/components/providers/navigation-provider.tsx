"use client"

import { createContext, useContext, ReactNode } from "react"
import { usePathname } from "next/navigation"
import { NavigationHeader } from "@/components/ui/navigation-header"

interface NavigationContextType {
  showBackButton: boolean
  setShowBackButton: (show: boolean) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

interface NavigationProviderProps {
  children: ReactNode
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const pathname = usePathname()

  // Only show navigation header for auth pages, not dashboard pages
  const shouldShowHeader = pathname.startsWith('/auth') || 
    pathname === '/login' || 
    pathname === '/signup' ||
    pathname === '/'

  return (
    <NavigationContext.Provider value={{ showBackButton: true, setShowBackButton: () => {} }}>
      {shouldShowHeader ? (
        <div className="min-h-screen bg-gray-50">
          <NavigationHeader />
          <main className="pt-0">
            {children}
          </main>
        </div>
      ) : (
        children
      )}
    </NavigationContext.Provider>
  )
}
