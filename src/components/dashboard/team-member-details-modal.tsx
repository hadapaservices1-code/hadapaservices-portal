"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  Clock,
  Receipt,
  FolderOpen,
  Calendar,
  Activity,
  LogIn,
  LogOut,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  FileText
} from "lucide-react"
import { getEmployeeActivityDetails, type EmployeeActivityDetails } from "@/lib/team"
import { getEmployeeExpenses, type Expense } from "@/lib/expenses"
import { getUserTasks, type Task } from "@/lib/tasks"
import { getEmployeeTimeTrackingDetails, type ManagerTimeTrackingDetails } from "@/lib/time-tracking"
import { createClient } from "@/lib/supabase-client"
import type { TeamMember } from "@/lib/team"

interface TeamMemberDetailsModalProps {
  member: TeamMember | null
  isOpen: boolean
  onClose: () => void
}

export function TeamMemberDetailsModal({ member, isOpen, onClose }: TeamMemberDetailsModalProps) {
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeActivityDetails | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [timeTrackingDetails, setTimeTrackingDetails] = useState<ManagerTimeTrackingDetails | null>(null)
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (isOpen && member) {
      fetchMemberDetails()
    } else {
      // Reset state when modal closes
      setEmployeeDetails(null)
      setExpenses([])
      setTasks([])
      setTimeTrackingDetails(null)
      setProjects([])
      setActiveTab("overview")
    }
  }, [isOpen, member])

  const fetchMemberDetails = async () => {
    if (!member) return

    setIsLoading(true)
    try {
      const [
        activityDetails,
        expensesData,
        tasksData,
        timeTrackingData
      ] = await Promise.all([
        getEmployeeActivityDetails(member.id).catch(() => null),
        getEmployeeExpenses(member.id).catch(() => []),
        getUserTasks(member.id).catch(() => []),
        getEmployeeTimeTrackingDetails(member.id).catch(() => null)
      ])

      setEmployeeDetails(activityDetails)
      setExpenses(expensesData)
      setTasks(tasksData)
      setTimeTrackingDetails(timeTrackingData)

      // Get unique projects from tasks
      const projectMap = new Map<string, string>()
      tasksData.forEach(task => {
        if (task.project_id && task.project_name) {
          projectMap.set(task.project_id, task.project_name)
        }
      })

      // Also fetch project names for tasks that have project_id but no project_name
      const projectIds = Array.from(new Set(
        tasksData
          .filter(task => task.project_id && !task.project_name)
          .map(task => task.project_id!)
      ))

      if (projectIds.length > 0) {
        const supabase = createClient()
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds)

        projectsData?.forEach(project => {
          projectMap.set(project.id, project.name)
        })
      }

      setProjects(Array.from(projectMap.entries()).map(([id, name]) => ({ id, name })))
    } catch (error) {
      console.error('Error fetching member details:', error)
    } finally {
      setIsLoading(false)
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

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'N/A'
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!member) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {member.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </span>
            </div>
            <div>
              <div className="text-2xl">{member.full_name || 'Unknown User'}</div>
              <div className="text-sm font-normal text-gray-500">{member.email}</div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Complete activity overview and performance metrics
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="time">Time Tracking</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="leaves">Leaves</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Tasks</p>
                        <p className="text-2xl font-bold">{tasks.length}</p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Projects</p>
                        <p className="text-2xl font-bold">{projects.length}</p>
                      </div>
                      <FolderOpen className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Expenses</p>
                        <p className="text-2xl font-bold">{expenses.length}</p>
                      </div>
                      <Receipt className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Leave Requests</p>
                        <p className="text-2xl font-bold">{employeeDetails?.leaveRequests.length || 0}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-gray-500">{formatDateTime(task.created_at)}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Tasks</CardTitle>
                  <CardDescription>{tasks.length} total tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div key={task.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            )}
                          </div>
                          <Badge className={getPriorityColor(task.priority || 'low')}>
                            {task.priority || 'low'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-4 text-sm">
                            {task.project_name && (
                              <span className="text-gray-600">
                                <FolderOpen className="h-4 w-4 inline mr-1" />
                                {task.project_name}
                              </span>
                            )}
                            {task.due_date && (
                              <span className="text-gray-600">
                                <Calendar className="h-4 w-4 inline mr-1" />
                                Due: {formatDate(task.due_date)}
                              </span>
                            )}
                          </div>
                          <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No tasks assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Projects</CardTitle>
                  <CardDescription>{projects.length} projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => {
                      const projectTasks = tasks.filter(t => t.project_id === project.id)
                      const completedTasks = projectTasks.filter(t => t.status === 'completed').length
                      return (
                        <Card key={project.id} className="p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <FolderOpen className="h-5 w-5 text-purple-500" />
                            <h4 className="font-semibold">{project.name}</h4>
                          </div>
                          <div className="text-sm text-gray-600">
                            {projectTasks.length} tasks • {completedTasks} completed
                          </div>
                        </Card>
                      )
                    })}
                    {projects.length === 0 && (
                      <p className="text-center text-gray-500 py-8 col-span-2">No projects assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Time Tracking Tab */}
            <TabsContent value="time" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Time Tracking</CardTitle>
                  <CardDescription>
                    Login/logout times and timesheet entries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {timeTrackingDetails ? (
                    <div className="space-y-4">
                      {/* Monthly Summary */}
                      {timeTrackingDetails.monthlySummary && (
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">Total Hours (30d)</p>
                            <p className="text-2xl font-bold">{timeTrackingDetails.monthlySummary.totalHours.toFixed(1)}</p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600">Days Worked</p>
                            <p className="text-2xl font-bold">{timeTrackingDetails.monthlySummary.daysWorked}</p>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <p className="text-sm text-gray-600">Avg Hours/Day</p>
                            <p className="text-2xl font-bold">{timeTrackingDetails.monthlySummary.averageHoursPerDay.toFixed(1)}</p>
                          </div>
                        </div>
                      )}

                      {/* Recent Time Entries */}
                      <div>
                        <h4 className="font-semibold mb-3">Recent Time Entries</h4>
                        <div className="space-y-2">
                          {timeTrackingDetails.timeEntries.slice(0, 10).map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <LogIn className="h-4 w-4 text-green-500" />
                                  <span className="text-sm">{formatTime(entry.timeIn)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <LogOut className="h-4 w-4 text-red-500" />
                                  <span className="text-sm">{formatTime(entry.timeOut)}</span>
                                </div>
                                <span className="text-sm text-gray-600">{formatDate(entry.date)}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{entry.totalHours.toFixed(2)}h</span>
                              </div>
                            </div>
                          ))}
                          {timeTrackingDetails.timeEntries.length === 0 && (
                            <p className="text-center text-gray-500 py-4">No time entries found</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No time tracking data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Expenses</CardTitle>
                  <CardDescription>{expenses.length} total expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-semibold">{expense.description}</p>
                          <p className="text-sm text-gray-600">
                            {expense.expense_categories?.name || 'No category'} • {formatDate(expense.expense_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${expense.amount.toFixed(2)}</p>
                          <Badge className={getStatusColor(expense.status)}>{expense.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {expenses.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No expenses found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Leaves Tab */}
            <TabsContent value="leaves" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Leave Requests</CardTitle>
                  <CardDescription>
                    {employeeDetails?.leaveRequests.length || 0} total requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {employeeDetails?.leaveRequests.map((leave) => (
                      <div key={leave.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-semibold">
                            {leave.leave_types?.name || 'Leave'} Request
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Applied: {formatDateTime(leave.applied_at)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(leave.status)}>{leave.status}</Badge>
                      </div>
                    ))}
                    {(!employeeDetails?.leaveRequests || employeeDetails.leaveRequests.length === 0) && (
                      <p className="text-center text-gray-500 py-8">No leave requests found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

