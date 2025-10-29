"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
  Clock,
  Sparkles,
  FolderOpen,
  Receipt
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface SidebarProps {
  userRole: "employee" | "manager" | "admin"
  userName: string
  userDepartment?: string
}

const employeeNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Projects", href: "/dashboard/my-projects", icon: FolderOpen },
  { name: "My Tasks", href: "/dashboard/tasks", icon: FileText },
  { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { name: "Leave", href: "/dashboard/leave", icon: Plane },
  { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
  { name: "Profile", href: "/dashboard/profile", icon: Settings },
]

const managerNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  { name: "Team Activity", href: "/dashboard/team-activity", icon: Activity },
  { name: "Time Tracking", href: "/dashboard/time-tracking", icon: Clock },
  { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { name: "Leave", href: "/dashboard/leave", icon: Plane },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Tasks", href: "/dashboard/tasks", icon: FileText },
  { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar({ userRole, userName, userDepartment }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

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
      <motion.div
        className="lg:hidden fixed top-4 left-4 z-50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isDesktop ? 0 : 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="glass"
          size="icon"
          className="neon-glow"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <motion.div
            animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </motion.div>
        </Button>
      </motion.div>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.div
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 glass border-r border-glass-border",
            "lg:translate-x-0"
          )}
          initial={{ x: "-100%" }}
          animate={{ 
            x: isMobileMenuOpen || isDesktop ? 0 : "-100%"
          }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          <div className="flex flex-col h-full min-h-0">
            {/* Header */}
            <motion.div 
              className="flex items-center space-x-2 p-4 border-b border-glass-border"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div 
                className="p-2 bg-gradient-primary rounded-lg neon-glow"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold gradient-text">Company Portal</h1>
                <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {userRole}
                </p>
              </div>
            </motion.div>

            {/* User Info */}
            <motion.div 
              className="p-4 border-b border-glass-border"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center space-x-2">
                <motion.div 
                  className="w-10 h-10 bg-gradient-accent rounded-full flex items-center justify-center neon-glow"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <span className="text-white font-bold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </motion.div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{userName}</p>
                  {userDepartment && (
                    <p className="text-xs text-muted-foreground">{userDepartment}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Navigation */}
            <nav className="flex-1 p-4 pb-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent min-h-0">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 group relative overflow-hidden",
                        isActive
                          ? "bg-gradient-primary text-primary-foreground shadow-neon-lg"
                          : "text-muted-foreground hover:text-foreground hover:bg-glass-bg hover:shadow-glass"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 3 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Icon className="h-4 w-4" />
                      </motion.div>
                      <span className="relative z-10">{item.name}</span>
                      
                      {/* Animated background effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                    </Link>
                  </motion.div>
                )
              })}
            </nav>

            {/* Footer */}
            <motion.div 
              className="p-3 border-t border-glass-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                variant="ghost"
                className="w-full justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-glass-bg hover:shadow-glass group py-2"
                onClick={handleSignOut}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                </motion.div>
                Sign Out
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && !isDesktop && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
