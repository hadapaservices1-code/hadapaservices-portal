"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { LoginForm } from "@/components/auth/login-form"
import { SignupForm } from "@/components/auth/signup-form"
import { Building2, Sparkles } from "lucide-react"

// Seeded random number generator for consistent SSR/CSR
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10" />
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(circle at 20% 80%, hsl(217 91% 60% / 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 20%, hsl(262 83% 58% / 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 40% 40%, hsl(188 100% 50% / 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 80%, hsl(217 91% 60% / 0.1) 0%, transparent 50%)"
          ]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Floating particles - only render on client to avoid hydration mismatch */}
      {isClient && (
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => {
            const seed = i * 12345 + 67890 // Consistent seed for each particle
            const left = seededRandom(seed) * 100
            const top = seededRandom(seed + 1) * 100
            const duration = 3 + seededRandom(seed + 2) * 2
            const delay = seededRandom(seed + 3) * 2
            
            return (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary/30 rounded-full"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                }}
                animate={{
                  y: [-20, 20, -20],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration,
                  repeat: Infinity,
                  delay,
                }}
              />
            )
          })}
        </div>
      )}

      
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left side - Branding */}
        <motion.div 
          className="hidden lg:block space-y-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-4">
              <motion.div 
                className="p-4 bg-gradient-primary rounded-2xl neon-glow"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Building2 className="h-10 w-10 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold gradient-text">Company Portal</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Next-Gen Workplace
                </p>
              </div>
            </div>
            <motion.p 
              className="text-2xl text-foreground leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Your gateway to seamless workplace collaboration and management
            </motion.p>
          </motion.div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Employee Dashboard</h3>
                <p className="text-gray-600">Access your tasks, schedule, and company updates</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manager Tools</h3>
                <p className="text-gray-600">Manage your team and oversee operations</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Secure & Reliable</h3>
                <p className="text-gray-600">Enterprise-grade security with real-time updates</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right side - Auth Forms */}
        <div className="w-full flex justify-center">
          {isLogin ? (
            <LoginForm onToggleMode={() => setIsLogin(false)} />
          ) : (
            <SignupForm onToggleMode={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  )
}
