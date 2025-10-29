"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock,
  Plus
} from "lucide-react"
import { BackButton } from "@/components/ui/back-button"

export default function SchedulePage() {
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
                <Calendar className="h-8 w-8 text-primary" />
                <span>Schedule</span>
              </h1>
              <p className="text-gray-600 mt-2">
                View and manage your schedule and meetings
              </p>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </motion.div>

        {/* Schedule View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="!bg-[#3c7dc7]/20 !border-[#3c7dc7]/30">
            <CardHeader>
              <CardTitle className="text-black">Upcoming Events</CardTitle>
              <CardDescription className="text-black/80">
                Your scheduled meetings and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-[#3c7dc7]/60 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">No upcoming events</h3>
                <p className="text-black/80 mb-6">
                  Create your first event to get started with scheduling
                </p>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="!bg-[#3c7dc7]/20 !border-[#3c7dc7]/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-black">
                <Clock className="h-5 w-5" />
                <span>Today's Schedule</span>
              </CardTitle>
              <CardDescription className="text-black/80">
                Your schedule for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600">No scheduled events for today</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

