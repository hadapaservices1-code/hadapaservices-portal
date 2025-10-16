"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  FolderOpen, 
  Calendar, 
  Flag, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import { BackButton } from "@/components/ui/back-button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateProjectModal } from "@/components/dashboard/create-project-modal"
import { EditProjectModal } from "@/components/dashboard/edit-project-modal"
import { ProjectDetailsModal } from "@/components/dashboard/project-details-modal"
import { 
  getManagerProjects, 
  getProjectStats, 
  deleteProject,
  type Project 
} from "@/lib/projects"

export default function ProjectsPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [profile, setProfile] = useState<{ id: string; full_name: string; role: string } | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState({
    total: 0,
    planning: 0,
    in_progress: 0,
    completed: 0,
    on_hold: 0,
    high_priority: 0,
    medium_priority: 0,
    low_priority: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
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

  const fetchProjects = async () => {
    if (!user?.id) return

    try {
      const [projectsData, statsData] = await Promise.all([
        getManagerProjects(user.id),
        getProjectStats(user.id)
      ])
      
      setProjects(projectsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchProjects()
    }
  }, [user?.id])

  const handleProjectCreated = () => {
    fetchProjects()
  }

  const handleProjectUpdated = () => {
    fetchProjects()
    setIsEditModalOpen(false)
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!user?.id) return

    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      const result = await deleteProject(projectId, user.id)
      if (result.success) {
        fetchProjects()
      } else {
        alert(result.message)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
                <FolderOpen className="h-8 w-8 text-primary" />
                <span>Projects</span>
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your team's projects and track progress
              </p>
            </div>
          </div>
          <CreateProjectModal onProjectCreated={handleProjectCreated} />
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
                  <p className="text-2xl font-bold text-black">{stats.total}</p>
                </div>
                <FolderOpen className="h-8 w-8 text-[#3c7dc7]" />
              </div>
            </CardContent>
          </Card>

          <Card className="!bg-[#3c7dc7]/20 !border-[#3c7dc7]/30 hover:!bg-[#3c7dc7]/30 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">In Progress</p>
                  <p className="text-2xl font-bold text-black">{stats.in_progress}</p>
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
                  <p className="text-sm font-medium text-black">Completed</p>
                  <p className="text-2xl font-bold text-black">{stats.completed}</p>
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
                  <p className="text-sm font-medium text-black">High Priority</p>
                  <p className="text-2xl font-bold text-black">{stats.high_priority}</p>
                </div>
                <Flag className="h-8 w-8 text-[#3c7dc7]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Projects List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="!bg-[#3c7dc7]/20 !border-[#3c7dc7]/30 hover:!bg-[#3c7dc7]/30 transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-black">
                <span>All Projects</span>
                <Badge variant="outline" className="text-sm bg-[#3c7dc7]/20 text-[#3c7dc7] border-[#3c7dc7]/40">
                  {projects.length} project{projects.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              <CardDescription className="text-black/80">
                Manage and track all your team's projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-16 w-16 text-[#3c7dc7]/60 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-black mb-2">No projects yet</h3>
                  <p className="text-black/80 mb-6">
                    Create your first project to get started with project management
                  </p>
                  <CreateProjectModal onProjectCreated={handleProjectCreated} />
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {project.name}
                            </h3>
                            <Badge className={getStatusColor(project.status)}>
                              {project.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(project.priority)}>
                              {project.priority} priority
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {project.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Start: {formatDate(project.start_date)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>End: {formatDate(project.end_date)}</span>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedProject(project)
                                setIsDetailsModalOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedProject(project)
                                setIsEditModalOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteProject(project.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Modals */}
        {selectedProject && (
          <>
            <EditProjectModal
              project={selectedProject}
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false)
                setSelectedProject(null)
              }}
              onProjectUpdated={handleProjectUpdated}
            />
            <ProjectDetailsModal
              project={selectedProject}
              isOpen={isDetailsModalOpen}
              onClose={() => {
                setIsDetailsModalOpen(false)
                setSelectedProject(null)
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
