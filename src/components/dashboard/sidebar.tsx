"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  Building2,
  BarChart3,
  Plane,
  Activity,
  Clock
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface SidebarProps {
  userRole: "employee" | "manager" | "admin"
  userName: string
  userDepartment?: string
}

const employeeNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Tasks", href: "/dashboard/tasks", icon: FileText },
  { name: "Leave", href: "/dashboard/leave", icon: Plane },
  { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
  { name: "Profile", href: "/dashboard/profile", icon: Settings },
]

const managerNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Team Activity", href: "/dashboard/team-activity", icon: Activity },
  { name: "Time Tracking", href: "/dashboard/time-tracking", icon: Clock },
  { name: "Leave", href: "/dashboard/leave", icon: Plane },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Tasks", href: "/dashboard/tasks", icon: FileText },
  { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar({ userRole, userName, userDepartment }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navItems = userRole === "employee" ? employeeNavItems : managerNavItems

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
      }
      
      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // Wait a moment for the session to clear on the server side
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Force a hard redirect to clear any cached state with sign out parameter
      window.location.href = "/auth?signout=true"
    } catch (err) {
      console.error('Sign out error:', err)
      // Even if there's an error, redirect to auth page
      window.location.href = "/auth"
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center space-x-3 p-6 border-b border-gray-200">
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Company Portal</h1>
              <p className="text-sm text-gray-500 capitalize">{userRole}</p>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{userName}</p>
                {userDepartment && (
                  <p className="text-sm text-gray-500">{userDepartment}</p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-100"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
