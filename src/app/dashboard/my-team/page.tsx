"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  MoreHorizontal,
  Mail,
  Clock,
  User
} from "lucide-react"
import { BackButton } from "@/components/ui/back-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getTeamMembers,
  getTeamStats,
  type TeamMember,
  type TeamStats
} from "@/lib/team"
import { TeamMemberDetailsModal } from "@/components/dashboard/team-member-details-modal"

export default function MyTeamPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [profile, setProfile] = useState<{ id: string; full_name: string; role: string } | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          router.push('/auth')
          return
        }
        setUser(user)
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

  const fetchTeamData = async () => {
    if (!user?.id) return
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('manager_id', user.id)
        .eq('role', 'employee')
      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching employees reporting to me:', error)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchTeamData()
    }
  }, [user?.id])

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
        {/* Header - My Team */}
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
                <Users className="h-8 w-8 text-primary" />
                <span>My Team</span>
              </h1>
              <p className="text-gray-600 mt-2">
                View the members in your team
              </p>
            </div>
          </div>
        </motion.div>

        {/* Members List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="!bg-[#3c7dc7]/20 !border-[#3c7dc7]/30 hover:!bg-[#3c7dc7]/30 transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-black">
                <span>Team Members</span>
                <Badge variant="outline" className="text-sm bg-[#3c7dc7]/20 text-[#3c7dc7] border-[#3c7dc7]/40">
                  {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              <CardDescription className="text-black/80">
                View all members in your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-[#3c7dc7]/60 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-black mb-2">No team members yet</h3>
                  <p className="text-black/80">Members will appear here as they are added</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white/50 cursor-pointer"
                      onClick={() => {
                        setSelectedMember(member)
                        setIsDetailsModalOpen(true)
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {member.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{member.full_name || 'Unknown User'}</h3>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={e => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={e => {
                                e.stopPropagation()
                                setSelectedMember(member)
                                setIsDetailsModalOpen(true)
                              }}
                            >
                              <User className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={e => e.stopPropagation()}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="space-y-2">
                        <Badge className="bg-gray-100 text-gray-800">
                          {member.department || 'No Department'}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          {member.status || 'offline'}
                        </Badge>
                        {member.position && (
                          <p className="text-sm text-gray-600">{member.position}</p>
                        )}
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>Tasks: {member.completed_tasks || 0}/{member.task_count || 0}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        {/* Details Modal */}
        <TeamMemberDetailsModal
          member={selectedMember}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false)
            setSelectedMember(null)
          }}
        />
      </div>
    </div>
  )
}
