"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart3, 
  TrendingUp,
  Users,
  FileText,
  Clock
} from "lucide-react"
import { BackButton } from "@/components/ui/back-button"

export default function AnalyticsPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [profile, setProfile] = useState<{ id: string; full_name: string; role: string } | null>(null)
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
          .select('id, full_name, role')
          .eq('id', user.id)
          .single()

        if (profileError || !profileData) {
          router.push('/auth')
          return
        }

        if (profileData.role !== 'manager') {
          router.push('/dashboard')
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-4"
        >
          <BackButton 
            variant="outline" 
            size="sm"
            className="flex-shrink-0"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <span>Analytics</span>
            </h1>
            <p className="text-gray-600 mt-2">
              Track team performance and insights
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="!bg-[#3c7dc7]/20 !border-[#3c7dc7]/30 hover:!bg-[#3c7dc7]/30 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">Total Projects</p>
                  <p className="text-2xl font-bold text-black">-</p>
                </div>
                <TrendingUp className="h-8 w-8 text-[#3c7dc7]" />
              </div>
            </CardContent>
          </Card>

          <Card className="!bg-[#3c7dc7]/20 !border-[#3c7dc7]/30 hover:!bg-[#3c7dc7]/30 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">Team Members</p>
                  <p className="text-2xl font-bold text-black">-</p>
                </div>
                <Users className="h-8 w-8 text-[#3c7dc7]" />
              </div>
            </CardContent>
          </Card>

          <Card className="!bg-[#3c7dc7]/20 !border-[#3c7dc7]/30 hover:!bg-[#3c7dc7]/30 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">Active Tasks</p>
                  <p className="text-2xl font-bold text-black">-</p>
                </div>
                <FileText className="h-8 w-8 text-[#3c7dc7]" />
              </div>
            </CardContent>
          </Card>

          <Card className="!bg-[#3c7dc7]/20 !border-[#3c7dc7]/30 hover:!bg-[#3c7dc7]/30 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">Hours Tracked</p>
                  <p className="text-2xl font-bold text-black">-</p>
                </div>
                <Clock className="h-8 w-8 text-[#3c7dc7]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Analytics Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="!bg-[#3c7dc7]/20 !border-[#3c7dc7]/30">
            <CardHeader>
              <CardTitle className="text-black">Analytics Dashboard</CardTitle>
              <CardDescription className="text-black/80">
                Comprehensive team performance metrics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-[#3c7dc7]/60 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">Analytics Coming Soon</h3>
                <p className="text-black/80">
                  Detailed analytics and reporting features will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

