"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Mail,
  Building2,
  Calendar,
  Edit
} from "lucide-react"
import { BackButton } from "@/components/ui/back-button"

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<{ 
    id: string; 
    full_name: string; 
    role: string;
    email: string;
    department: string | null;
    position: string | null;
    created_at: string;
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient()

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push('/auth')
          return
        }

        setUser(user)

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, role, email, department, position, created_at')
          .eq('id', user.id)
          .single()

        if (profileError || !profileData) {
          router.push('/auth')
          return
        }

        setProfile(profileData)
      } catch (error) {
        console.error('Error checking user:', error)
        router.push('/auth')
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [router])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'employee': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <BackButton 
              variant="outline" 
              size="sm"
              className="flex-shrink-0"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <User className="h-8 w-8 text-primary" />
                <span>Profile</span>
              </h1>
              <p className="text-gray-600 mt-2">
                View and manage your profile information
              </p>
            </div>
          </div>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="!bg-[#3c7dc7]/20 !border-[#3c7dc7]/30">
            <CardHeader>
              <CardTitle className="text-black">Personal Information</CardTitle>
              <CardDescription className="text-black/80">
                Your account details and information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-2xl">
                    {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
                  <Badge className={getRoleColor(profile.role)}>
                    {profile.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm font-medium">Email</span>
                  </div>
                  <p className="text-gray-900">{profile.email}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Department</span>
                  </div>
                  <p className="text-gray-900">{profile.department || 'Not specified'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Position</span>
                  </div>
                  <p className="text-gray-900">{profile.position || 'Not specified'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">Member Since</span>
                  </div>
                  <p className="text-gray-900">{formatDate(profile.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

