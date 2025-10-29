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
  Building2,
  TrendingUp,
  CheckCircle2,
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

export default function TeamPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [profile, setProfile] = useState<{ id: string; full_name: string; role: string } | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
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

  const fetchTeamData = async () => {
    if (!user?.id) return

    try {
      const [members, teamStats] = await Promise.all([
        getTeamMembers(user.id),
        getTeamStats(user.id)
      ])
      
      setTeamMembers(members)
      setStats(teamStats)
    } catch (error) {
      console.error('Error fetching team data:', error)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchTeamData()
    }
  }, [user?.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800'
      case 'away': return 'bg-yellow-100 text-yellow-800'
      case 'offline': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDepartmentColor = (department: string | null) => {
    if (!department) return 'bg-gray-100 text-gray-800'
    
    const colors: Record<string, string> = {
      'Engineering': 'bg-blue-100 text-blue-800',
      'Design': 'bg-purple-100 text-purple-800',
      'Product': 'bg-green-100 text-green-800',
      'Marketing': 'bg-orange-100 text-orange-800',
      'Sales': 'bg-red-100 text-red-800',
      'HR': 'bg-pink-100 text-pink-800',
    }
    
    return colors[department] || 'bg-gray-100 text-gray-800'
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
                <Users className="h-8 w-8 text-primary" />
                <span>Team Management</span>
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your team members and track their performance
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
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
                    <p className="text-sm font-medium text-black">Total Members</p>
                    <p className="text-2xl font-bold text-black">{stats.total_members}</p>
                  </div>
                  <Users className="h-8 w-8 text-[#3c7dc7]" />
                </div>
              </CardContent>
            </Card>

            <Card className="!bg-[#3c7dc7]/20 !border-[#3c7dc7]/30 hover:!bg-[#3c7dc7]/30 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-black">Active Members</p>
                    <p className="text-2xl font-bold text-black">{stats.active_members}</p>
                  </div>
                  <div className="h-8 w-8 bg-[#3c7dc7]/20 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-[#3c7dc7] rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="!bg-[#3c7dc7]/20 !border-[#3c7dc7]/30 hover:!bg-[#3c7dc7]/30 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-black">Completed Tasks</p>
                    <p className="text-2xl font-bold text-black">{stats.completed_tasks}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-[#3c7dc7]" />
                </div>
              </CardContent>
            </Card>

            <Card className="!bg-[#3c7dc7]/20 !border-[#3c7dc7]/30 hover:!bg-[#3c7dc7]/30 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-black">Productivity Rate</p>
                    <p className="text-2xl font-bold text-black">{stats.productivity_rate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-[#3c7dc7]" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Team Members List */}
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
                View and manage all team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-[#3c7dc7]/60 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-black mb-2">No team members yet</h3>
                  <p className="text-black/80">
                    Team members will appear here as they are added to the system
                  </p>
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
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedMember(member)
                                setIsDetailsModalOpen(true)
                              }}
                            >
                              <User className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={getDepartmentColor(member.department)}>
                            {member.department || 'No Department'}
                          </Badge>
                          <Badge className={getStatusColor(member.status || 'offline')}>
                            {member.status || 'offline'}
                          </Badge>
                        </div>

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

        {/* Team Member Details Modal */}
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

