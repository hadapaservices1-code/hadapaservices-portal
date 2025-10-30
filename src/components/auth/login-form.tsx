"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
// import { useRouter } from "next/navigation" // Removed as we use window.location.href
import { createClient } from "@/lib/supabase-client"
import { loginSchema, type LoginFormData } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2 } from "lucide-react"

interface LoginFormProps {
  onToggleMode: () => void
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // const router = useRouter() // Removed as we use window.location.href

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("=== LOGIN ATTEMPT START ===")
      console.log("Email:", data.email)
      console.log("Password length:", data.password.length)
      console.log("Normalized email:", data.email.trim().toLowerCase())
      
      const supabase = createClient()
      
      // Validate input before attempting login
      if (!data.email || !data.password) {
        setError("Please enter both email and password.")
        return
      }

      if (data.password.length < 6) {
        setError("Password must be at least 6 characters long.")
        return
      }

      // Test Supabase connection
      const { data: connectionTest } = await supabase.from('profiles').select('count').limit(1)
      console.log("Supabase connection test:", connectionTest ? "success" : "failed")
      
      // Check if user exists in profiles table
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', data.email.trim().toLowerCase())
        .single()
      console.log("Existing user check:", existingUser ? "found" : "not found")
      
      // Check current session before attempting login
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      console.log("Current session before login:", currentSession)

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      })

      console.log("Auth response:", { 
        user: authData?.user?.id, 
        session: authData?.session?.access_token ? "present" : "missing",
        error: error?.message 
      })

      if (error) {
        console.error("Login error details:", {
          message: error.message,
          status: error.status,
          name: error.name
        })
        
        // Provide more specific error messages
        if (error.message === "Invalid login credentials") {
          // Check if user exists in profiles to give better error message
          if (existingUser) {
            setError("Invalid password. Please check your password and try again.")
          } else {
            setError("No account found with this email. Please sign up first or check your email address.")
          }
        } else if (error.message.includes("Email not confirmed")) {
          setError("Please check your email and click the confirmation link before logging in.")
        } else if (error.message.includes("Too many requests")) {
          setError("Too many login attempts. Please wait a moment before trying again.")
        } else if (error.message.includes("Invalid email")) {
          setError("Please enter a valid email address.")
        } else {
          setError(`Login failed: ${error.message}`)
        }
        return
      }

      if (authData.user) {
        console.log("User signed in successfully:", {
          id: authData.user.id,
          email: authData.user.email,
          email_confirmed_at: authData.user.email_confirmed_at
        })
        
        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single()

        if (profileError) {
          console.error("Profile fetch error:", profileError)
          setError("User profile not found. Please contact support.")
          return
        }

        console.log("Profile found:", profile)
        
        // Wait a moment for session to be established
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if session is properly established
        const { data: { session } } = await supabase.auth.getSession()
        console.log("Session after login:", {
          user: session?.user?.id,
          access_token: session?.access_token ? "present" : "missing",
          expires_at: session?.expires_at
        })
        
        if (session && session.user) {
          // Sync session cookies with backend so middleware sees the user right away
          try {
            await fetch('/api/auth/set-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              }),
              credentials: 'include',
            });
          } catch (e) {
            // Non-fatal; fallback to redirect regardless
          }
          console.log("Login successful, redirecting to dashboard");
          window.location.href = "/dashboard";
        } else {
          setError("Session not established. Please try again.");
        }
      } else {
        setError("Login failed. Please try again.")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
      console.log("=== LOGIN ATTEMPT END ===")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your account to continue
        </CardDescription>
        <div className="text-xs text-gray-500 text-center mt-2">
          <p>Having trouble logging in?</p>
          <p>• Make sure you've confirmed your email</p>
          <p>• Check your email and password</p>
          <p>• Try signing up if you don't have an account</p>
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-600 font-medium">Quick Test:</p>
            <p className="text-xs text-blue-500">Email: test@example.com</p>
            <p className="text-xs text-blue-500">Password: test123456</p>
            <button
              type="button"
              onClick={async () => {
                try {
                  const supabase = createClient()
                  const { data, error } = await supabase.auth.signUp({
                    email: 'test@example.com',
                    password: 'test123456',
                    options: {
                      data: {
                        full_name: 'Test User',
                        role: 'employee',
                      }
                    }
                  })
                  if (error) {
                    console.log('Test account creation error:', error.message)
                  } else {
                    console.log('Test account created:', data.user?.id)
                    alert('Test account created! You can now try logging in.')
                  }
                } catch (err) {
                  console.error('Test account creation failed:', err)
                }
              }}
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              Create Test Account
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <div className="flex flex-col space-y-2">
                <span>{error}</span>
                {error.includes("Invalid email or password") && (
                  <div className="text-xs text-gray-600">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={onToggleMode}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Sign up here
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password")}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <button
            type="button"
            onClick={onToggleMode}
            className="text-primary hover:underline font-medium"
            disabled={isLoading}
          >
            Sign up
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
