"use client"

import { useState, useEffect } from "react"
import { type Project } from "@/lib/projects"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Calendar, 
  Flag, 
  Clock, 
  FileText, 
  User,
  X,
  Users,
  TrendingUp,
  UserPlus,
  UserMinus,
  Trash2
} from "lucide-react"
import { 
  getProjectEmployees,
  getProjectTotalTime,
  getAvailableEmployees,
  assignEmployeeToProject,
  removeEmployeeFromProject,
  type ProjectEmployee
} from "@/lib/projects"
import type { TeamMember } from "@/lib/team"

interface ProjectDetailsEnhancedModalProps {
  project: Project
  managerId: string
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export function ProjectDetailsEnhancedModal({ 
  project, 
  managerId,
  isOpen, 
  onClose,
  onUpdate
}: ProjectDetailsEnhancedModalProps) {
  const [employees, setEmployees] = useState<ProjectEmployee[]>([])
  const [availableEmployees, setAvailableEmployees] = useState<Array<{ id: string; full_name: string; email: string }>>([])
  const [totalTime, setTotalTime] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (isOpen && project.id) {
      fetchProjectData()
    } else {
      setEmployees([])
      setAvailableEmployees([])
      setTotalTime(0)
      setSelectedEmployeeId("")
      setActiveTab("overview")
    }
  }, [isOpen, project.id])

  const fetchProjectData = async () => {
    setIsLoading(true)
    try {
      const [projectEmployees, totalTimeSpent, available] = await Promise.all([
        getProjectEmployees(project.id),
        getProjectTotalTime(project.id),
        getAvailableEmployees(managerId, project.id)
      ])

      setEmployees(projectEmployees)
      setTotalTime(totalTimeSpent)
      setAvailableEmployees(available)
    } catch (error) {
      console.error('Error fetching project data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignEmployee = async () => {
    if (!selectedEmployeeId) return

    setIsLoading(true)
    try {
      const result = await assignEmployeeToProject(project.id, selectedEmployeeId, managerId)
      if (result.success) {
        await fetchProjectData()
        setSelectedEmployeeId("")
        onUpdate?.()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error assigning employee:', error)
      alert('Failed to assign employee')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveEmployee = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this employee from the project?')) return

    setIsLoading(true)
    try {
      const result = await removeEmployeeFromProject(project.id, userId)
      if (result.success) {
        await fetchProjectData()
        onUpdate?.()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error removing employee:', error)
      alert('Failed to remove employee')
    } finally {
      setIsLoading(false)
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysRemaining = () => {
    const endDate = new Date(project.end_date)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysRemaining = getDaysRemaining()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                {project.name}
              </DialogTitle>
              <DialogDescription className="text-base text-gray-600">
                Project details and team management
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="team">Team & Time</TabsTrigger>
              <TabsTrigger value="assign">Assign Employee</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Status and Priority Badges */}
              <div className="flex items-center space-x-3">
                <Badge className={`${getStatusColor(project.status)} text-sm font-medium`}>
                  {project.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge className={`${getPriorityColor(project.priority)} text-sm font-medium`}>
                  {project.priority.toUpperCase()} PRIORITY
                </Badge>
              </div>

              {/* Project Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Assigned Employees</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-800">{employees.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Total Hours</span>
                  </div>
                  <p className="text-2xl font-bold text-green-800">{totalTime.toFixed(1)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Days Remaining</span>
                  </div>
                  <p className={`text-2xl font-bold ${
                    daysRemaining < 0 ? 'text-red-600' : 
                    daysRemaining < 7 ? 'text-yellow-600' : 
                    'text-purple-800'
                  }`}>
                    {daysRemaining < 0 ? Math.abs(daysRemaining) : daysRemaining}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Description</span>
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Project Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Project Timeline</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Start Date</span>
                    </div>
                    <p className="text-blue-800 font-semibold">
                      {formatDate(project.start_date)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-900">End Date</span>
                    </div>
                    <p className="text-green-800 font-semibold">
                      {formatDate(project.end_date)}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Team & Time Tab */}
            <TabsContent value="team" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Assigned Team Members</h3>
                <Badge variant="outline" className="text-sm">
                  {employees.length} member{employees.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {employees.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No employees assigned to this project yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {employees.map((employee) => (
                    <div key={employee.user_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {employee.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{employee.full_name}</h4>
                            <p className="text-sm text-gray-600">{employee.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEmployee(employee.user_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-600">Total Hours</p>
                          <p className="text-lg font-bold text-green-800">{employee.total_hours.toFixed(1)}h</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-600">Entries</p>
                          <p className="text-lg font-bold text-blue-800">{employee.entries_count}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-600">Last Entry</p>
                          <p className="text-sm font-semibold text-purple-800">
                            {employee.last_entry_date ? formatDate(employee.last_entry_date) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Assign Employee Tab */}
            <TabsContent value="assign" className="space-y-4 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Assign New Employee</h3>
                
                <div className="flex items-center space-x-3">
                  <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select an employee to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEmployees.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No available employees to assign
                        </div>
                      ) : (
                        availableEmployees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name} ({emp.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={handleAssignEmployee}
                    disabled={!selectedEmployeeId || availableEmployees.length === 0}
                    className="whitespace-nowrap"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign
                  </Button>
                </div>

                {availableEmployees.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      All team members are already assigned to this project.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

