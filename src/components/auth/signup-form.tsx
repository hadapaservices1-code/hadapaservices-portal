"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
// import { useRouter } from "next/navigation" // Removed as we use window.location.href
import { createClient } from "@/lib/supabase-client"
import { signupSchema, type SignupFormData } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, User, Building2, Briefcase } from "lucide-react"

interface SignupFormProps {
  onToggleMode: () => void
}

export function SignupForm({ onToggleMode }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // const router = useRouter() // Removed as we use window.location.href

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("Attempting to sign up with:", data.email)
      console.log("Password length:", data.password.length)
      
      // First, create the user account
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role,
            department: data.department,
            position: data.position,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (authError) {
        console.error("Auth error:", authError)
        setError(authError.message)
        return
      }

      if (authData.user) {
        console.log("User created successfully:", authData.user.id)
        
        // Check if email confirmation is required
        if (authData.user.email_confirmed_at) {
          // User is immediately confirmed, create profile and log in
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: authData.user.id,
              email: data.email.trim().toLowerCase(),
              full_name: data.fullName,
              role: data.role,
              department: data.department || null,
              position: data.position || null,
            })

          if (profileError) {
            console.error("Profile creation error:", profileError)
            setError(`Failed to create user profile: ${profileError.message}`)
            return
          }

          console.log("User and profile created successfully!")
          
          // Wait for the session to be fully established
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Check if session is properly established
          const { data: { session } } = await supabase.auth.getSession()
          console.log("Session after signup:", session)
          
          if (session) {
            // Force a page refresh to ensure middleware picks up the new session
            window.location.href = "/dashboard"
          } else {
            setError("Session not established. Please try logging in.")
          }
        } else {
          // Email confirmation required
          setError("Please check your email and click the confirmation link to complete your registration. Once confirmed, you can log in with your credentials.")
        }
      }
    } catch (err) {
      console.error("Signup error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create account</CardTitle>
        <CardDescription className="text-center">
          Sign up to get started with your company portal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                className="pl-10"
                {...register("fullName")}
                disabled={isLoading}
              />
            </div>
            {errors.fullName && (
              <p className="text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>

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
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("role")}
              disabled={isLoading}
            >
              <option value="">Select your role</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department (Optional)</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="department"
                type="text"
                placeholder="Enter your department"
                className="pl-10"
                {...register("department")}
                disabled={isLoading}
              />
            </div>
            {errors.department && (
              <p className="text-sm text-red-600">{errors.department.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position (Optional)</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="position"
                type="text"
                placeholder="Enter your position"
                className="pl-10"
                {...register("position")}
                disabled={isLoading}
              />
            </div>
            {errors.position && (
              <p className="text-sm text-red-600">{errors.position.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                {...register("confirmPassword")}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <button
            type="button"
            onClick={onToggleMode}
            className="text-primary hover:underline font-medium"
            disabled={isLoading}
          >
            Sign in
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
