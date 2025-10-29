"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { 
  FolderOpen, 
  Clock,
  FileText,
  Plus,
  ChevronDown,
  ChevronRight,
  Calendar,
  TrendingUp
} from "lucide-react"
import { BackButton } from "@/components/ui/back-button"
import { 
  getUserAssignedProjects,
  getUserProjectTimesheetEntries,
  getUserProjectTotalHours,
  getUserProjectTasks,
  type Project
} from "@/lib/projects"
import { TimesheetEntryModal } from "@/components/dashboard/timesheet-entry-modal"
import { getAvailableProjects } from "@/lib/timesheet"
import { toast } from "sonner"

interface ProjectWithDetails extends Project {
  total_hours: number
  timesheet_entries: Array<{
    id: string
    date: string
    hours_worked: number
    description: string
    task_category: string | null
    billable: boolean
    status: string
    created_at: string
  }>
  tasks: Array<{
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    due_date: string | null
    created_at: string
  }>
}

export default function MyProjectsPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [profile, setProfile] = useState<{ id: string; full_name: string; role: string } | null>(null)
  const [projects, setProjects] = useState<ProjectWithDetails[]>([])
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false)
  const [availableProjects, setAvailableProjects] = useState<Project[]>([])
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

        if (profileData.role === 'manager') {
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

    setIsLoading(true)
    try {
      const assignedProjects = await getUserAssignedProjects(user.id)
      
      // Fetch details for each project
      const projectsWithDetails = await Promise.all(
        assignedProjects.map(async (project) => {
          const [totalHours, entries, tasks] = await Promise.all([
            getUserProjectTotalHours(user.id, project.id),
            getUserProjectTimesheetEntries(user.id, project.id),
            getUserProjectTasks(user.id, project.id)
          ])

          return {
            ...project,
            total_hours: totalHours,
            timesheet_entries: entries,
            tasks
          }
        })
      )

      setProjects(projectsWithDetails)
      
      // Also fetch available projects for timesheet entry modal
      const available = await getAvailableProjects(user.id)
      setAvailableProjects(available)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchProjects()
    }
  }, [user?.id])

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  const handleAddTime = (projectId: string) => {
    setSelectedProject(projectId)
    setIsTimesheetModalOpen(true)
  }

  const handleTimesheetEntryAdded = () => {
    fetchProjects()
    setIsTimesheetModalOpen(false)
    setSelectedProject(null)
    toast.success('Time entry added successfully')
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

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
                <span>My Projects</span>
              </h1>
              <p className="text-gray-600 mt-2">
                View your assigned projects and track your work
              </p>
            </div>
          </div>
        </motion.div>

        {/* Projects List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {projects.length === 0 ? (
            <Card className="!bg-[#3c7dc7]/20 !border-[#3c7dc7]/30">
              <CardContent className="p-12">
                <div className="text-center">
                  <FolderOpen className="h-16 w-16 text-[#3c7dc7]/60 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-black mb-2">No projects assigned</h3>
                  <p className="text-black/80">
                    Your manager will assign you to projects. Once assigned, they will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {projects.map((project, index) => {
                const isExpanded = expandedProjects.has(project.id)
                const completedTasks = project.tasks.filter(t => t.status === 'completed').length

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="!bg-white/80 !border-[#3c7dc7]/30 hover:!shadow-lg transition-all duration-200">
                      <CardHeader 
                        className="cursor-pointer hover:bg-gray-50/50 transition-colors"
                        onClick={() => toggleProject(project.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="mt-1">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-xl text-gray-900 mb-2">
                                {project.name}
                              </CardTitle>
                              <CardDescription className="text-gray-600 mb-3">
                                {project.description}
                              </CardDescription>
                              <div className="flex items-center space-x-3 flex-wrap gap-2">
                                <Badge className={getStatusColor(project.status)}>
                                  {project.status.replace('_', ' ')}
                                </Badge>
                                <Badge className={getPriorityColor(project.priority)}>
                                  {project.priority} priority
                                </Badge>
                                <div className="flex items-center space-x-1 text-sm text-gray-600">
                                  <Clock className="h-4 w-4" />
                                  <span>{project.total_hours.toFixed(1)}h total</span>
                                </div>
                                <div className="flex items-center space-x-1 text-sm text-gray-600">
                                  <FileText className="h-4 w-4" />
                                  <span>{completedTasks}/{project.tasks.length} tasks completed</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="pt-0 space-y-6">
                            {/* Project Stats */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Clock className="h-5 w-5 text-blue-600" />
                                  <span className="font-medium text-blue-900">Total Hours</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-800">{project.total_hours.toFixed(1)}h</p>
                              </div>
                              <div className="bg-green-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  <FileText className="h-5 w-5 text-green-600" />
                                  <span className="font-medium text-green-900">Tasks</span>
                                </div>
                                <p className="text-2xl font-bold text-green-800">
                                  {completedTasks}/{project.tasks.length}
                                </p>
                              </div>
                              <div className="bg-purple-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  <TrendingUp className="h-5 w-5 text-purple-600" />
                                  <span className="font-medium text-purple-900">Time Entries</span>
                                </div>
                                <p className="text-2xl font-bold text-purple-800">
                                  {project.timesheet_entries.length}
                                </p>
                              </div>
                            </div>

                            {/* Add Time Button */}
                            <div className="flex justify-end">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAddTime(project.id)
                                }}
                                className="bg-[#3c7dc7] hover:bg-[#3c7dc7]/90"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Time Entry
                              </Button>
                            </div>

                            {/* Time Entries */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                                <Clock className="h-5 w-5" />
                                <span>Time Entries</span>
                                <Badge variant="outline" className="ml-2">
                                  {project.timesheet_entries.length}
                                </Badge>
                              </h4>
                              {project.timesheet_entries.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-600">No time entries yet</p>
                                  <p className="text-xs text-gray-500 mt-1">Click "Add Time Entry" to log your work</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {project.timesheet_entries.slice(0, 10).map((entry) => (
                                    <div key={entry.id} className="border rounded-lg p-3 bg-gray-50/50">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900">{entry.description}</p>
                                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                            <span className="flex items-center space-x-1">
                                              <Calendar className="h-3 w-3" />
                                              <span>{formatDate(entry.date)}</span>
                                            </span>
                                            <span className="flex items-center space-x-1">
                                              <Clock className="h-3 w-3" />
                                              <span>{entry.hours_worked}h</span>
                                            </span>
                                            {entry.task_category && (
                                              <Badge variant="outline" className="text-xs">
                                                {entry.task_category}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        <Badge className={
                                          entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                                          entry.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                          'bg-yellow-100 text-yellow-800'
                                        }>
                                          {entry.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                  {project.timesheet_entries.length > 10 && (
                                    <p className="text-sm text-gray-500 text-center pt-2">
                                      Showing 10 of {project.timesheet_entries.length} entries
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Tasks */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                                <FileText className="h-5 w-5" />
                                <span>Assigned Tasks</span>
                                <Badge variant="outline" className="ml-2">
                                  {project.tasks.length}
                                </Badge>
                              </h4>
                              {project.tasks.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-600">No tasks assigned for this project</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {project.tasks.map((task) => (
                                    <div key={task.id} className="border rounded-lg p-3 bg-white">
                                      <div className="flex items-start justify-between mb-2">
                                        <h5 className="font-semibold text-gray-900">{task.title}</h5>
                                        <Badge className={getTaskStatusColor(task.status)}>
                                          {task.status}
                                        </Badge>
                                      </div>
                                      {task.description && (
                                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                          {task.description}
                                        </p>
                                      )}
                                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                                        <Badge className={getPriorityColor(task.priority)} variant="outline">
                                          {task.priority}
                                        </Badge>
                                        {task.due_date && (
                                          <span className="flex items-center space-x-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>Due: {formatDate(task.due_date)}</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Project Info */}
                            <div className="border-t pt-4">
                              <h4 className="font-semibold text-gray-900 mb-3">Project Information</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Start Date</p>
                                  <p className="font-medium text-gray-900">{formatDate(project.start_date)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">End Date</p>
                                  <p className="font-medium text-gray-900">{formatDate(project.end_date)}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                      )}
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Timesheet Entry Modal */}
        <Dialog open={isTimesheetModalOpen && !!selectedProject} onOpenChange={(open) => {
          if (!open) {
            setIsTimesheetModalOpen(false)
            setSelectedProject(null)
          }
        }}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            {selectedProject && (
              <TimesheetEntryModal
                userId={user.id}
                availableProjects={availableProjects.filter(p => p.id === selectedProject)}
                onEntryAdded={handleTimesheetEntryAdded}
                onClose={() => {
                  setIsTimesheetModalOpen(false)
                  setSelectedProject(null)
                }}
                isOpen={isTimesheetModalOpen}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

