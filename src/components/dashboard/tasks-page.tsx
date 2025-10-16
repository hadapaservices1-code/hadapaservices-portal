"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  X,
  Tag
} from "lucide-react"
import { 
  getUserTasks, 
  getUserTaskStats, 
  updateTaskStatus,
  type Task,
  type TaskStats 
} from "@/lib/tasks"
import { CreateTaskModal } from "./create-task-modal"
import { TaskDetailModal } from "./task-detail-modal"

interface TasksPageProps {
  userId: string
  userRole: "employee" | "manager" | "admin"
}

export function TasksPage({ userId, userRole }: TasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Fetch tasks and stats
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      const [tasksData, statsData] = await Promise.all([
        getUserTasks(userId),
        getUserTaskStats(userId)
      ])
      setTasks(tasksData)
      setTaskStats(statsData)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchTasks()
  }, [userId, fetchTasks])

  // Filter tasks based on search and filters
  useEffect(() => {
    let filtered = tasks

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(task => task.priority === priorityFilter)
    }

    setFilteredTasks(filtered)
  }, [tasks, searchTerm, statusFilter, priorityFilter])

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      // Check if this is a timesheet entry
      const task = tasks.find(t => t.id === taskId)
      if (task?.is_timesheet_entry) {
        // For timesheet entries, we can't change status directly
        // They are managed through the timesheet system
        alert('Timesheet entries cannot be updated through task management. Please use the timesheet system.')
        return
      }

      const result = await updateTaskStatus(taskId, newStatus as 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold', userId)
      if (result.success) {
        await fetchTasks() // Refresh tasks
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      alert('Failed to update task status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'on_hold':
        return 'bg-orange-100 text-orange-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'in_progress':
        return <Play className="h-4 w-4" />
      case 'on_hold':
        return <Pause className="h-4 w-4" />
      case 'cancelled':
        return <X className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed') return false
    return new Date(dueDate) < new Date()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-500">Manage and track your assigned tasks</p>
        </div>
        {userRole === 'manager' && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {taskStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{taskStats.total_tasks}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{taskStats.completed_tasks}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{taskStats.in_progress_tasks}</p>
                </div>
                <Play className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{taskStats.overdue_tasks}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your filters to see more tasks."
                  : "You don't have any tasks assigned yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className={`hover:shadow-md transition-shadow ${task.is_timesheet_entry ? 'border-l-4 border-l-blue-500' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {task.title}
                        {task.is_timesheet_entry && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Timesheet Entry
                          </span>
                        )}
                      </h3>
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusIcon(task.status)}
                        <span className="ml-1 capitalize">{task.status.replace('_', ' ')}</span>
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-gray-600 mb-3">{task.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {task.due_date && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span className={isOverdue(task.due_date, task.status) ? 'text-red-600 font-medium' : ''}>
                            {task.is_timesheet_entry ? 'Date: ' : 'Due: '}{formatDate(task.due_date)}
                          </span>
                        </div>
                      )}
                      
                      {task.is_timesheet_entry ? (
                        <>
                          {task.hours_worked && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{task.hours_worked}h worked</span>
                            </div>
                          )}
                          {task.billable !== undefined && (
                            <div className="flex items-center space-x-1">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                task.billable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {task.billable ? 'Billable' : 'Non-billable'}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        task.estimated_hours && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{task.estimated_hours}h estimated</span>
                          </div>
                        )
                      )}
                      
                      {task.project_name && (
                        <div className="flex items-center space-x-1">
                          <Tag className="h-4 w-4" />
                          <span>{task.project_name}</span>
                        </div>
                      )}
                    </div>
                    
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {task.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {task.is_timesheet_entry ? (
                      <div className="text-sm text-gray-500">
                        <span className="text-blue-600 font-medium">Timesheet Entry</span>
                        <br />
                        <span className="text-xs">Managed via timesheet system</span>
                      </div>
                    ) : (
                      <>
                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                          >
                            Start
                          </Button>
                        )}
                        
                        {task.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(task.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedTask(task)}
                        >
                          View Details
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateTaskModal
          onTaskCreated={fetchTasks}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
      
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onTaskUpdated={fetchTasks}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
