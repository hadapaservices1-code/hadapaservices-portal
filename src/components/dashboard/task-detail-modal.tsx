"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Calendar,
  Clock,
  Tag,
  User,
  CheckCircle2,
  Play,
  Pause,
  X,
  AlertCircle
} from "lucide-react"
import { updateTaskStatus, type Task } from "@/lib/tasks"

interface TaskDetailModalProps {
  task: Task
  onTaskUpdated: () => void
  onClose: () => void
}

export function TaskDetailModal({ task, onTaskUpdated, onClose }: TaskDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setIsUpdating(true)
      const result = await updateTaskStatus(task.id, newStatus as 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold', task.assigned_to)
      if (result.success) {
        onTaskUpdated()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      alert('Failed to update task status')
    } finally {
      setIsUpdating(false)
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed') return false
    return new Date(dueDate) < new Date()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <span>{task.title}</span>
            <Badge className={getStatusColor(task.status)}>
              {getStatusIcon(task.status)}
              <span className="ml-1 capitalize">{task.status.replace('_', ' ')}</span>
            </Badge>
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Task details and management options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          {task.description && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600">{task.description}</p>
            </div>
          )}

          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Due Date</p>
                  <p className={`text-sm ${isOverdue(task.due_date, task.status) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                    {formatDate(task.due_date)}
                    {isOverdue(task.due_date, task.status) && ' (Overdue)'}
                  </p>
                </div>
              </div>

              {task.estimated_hours && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Estimated Hours</p>
                    <p className="text-sm text-gray-600">{task.estimated_hours} hours</p>
                  </div>
                </div>
              )}

              {task.actual_hours > 0 && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Actual Hours</p>
                    <p className="text-sm text-gray-600">{task.actual_hours} hours</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {task.project_name && (
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Project</p>
                    <p className="text-sm text-gray-600">{task.project_name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Assigned By</p>
                  <p className="text-sm text-gray-600">{task.assigned_by_name || 'Unknown'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">Created</p>
                <p className="text-sm text-gray-600">
                  {new Date(task.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Status Actions */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Actions</h4>
            <div className="flex flex-wrap gap-2">
              {task.status === 'pending' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate('in_progress')}
                  disabled={isUpdating}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Task
                </Button>
              )}
              
              {task.status === 'in_progress' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={isUpdating}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate('on_hold')}
                    disabled={isUpdating}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Put on Hold
                  </Button>
                </>
              )}
              
              {task.status === 'on_hold' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate('in_progress')}
                  disabled={isUpdating}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume Task
                </Button>
              )}
              
              {task.status !== 'completed' && task.status !== 'cancelled' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Task
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

