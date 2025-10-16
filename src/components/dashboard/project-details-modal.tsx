"use client"

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
import { 
  Calendar, 
  Flag, 
  Clock, 
  FileText, 
  User,
  X
} from "lucide-react"

interface ProjectDetailsModalProps {
  project: Project
  isOpen: boolean
  onClose: () => void
}

export function ProjectDetailsModal({ 
  project, 
  isOpen, 
  onClose 
}: ProjectDetailsModalProps) {
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
      month: 'long',
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
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                {project.name}
              </DialogTitle>
              <DialogDescription className="text-base text-gray-600">
                Project details and information
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and Priority Badges */}
          <div className="flex items-center space-x-3">
            <Badge className={`${getStatusColor(project.status)} text-sm font-medium`}>
              {project.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge className={`${getPriorityColor(project.priority)} text-sm font-medium`}>
              {project.priority.toUpperCase()} PRIORITY
            </Badge>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            {/* Days Remaining */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-900">Time Remaining</span>
              </div>
              <p className={`text-lg font-bold ${
                daysRemaining < 0 ? 'text-red-600' : 
                daysRemaining < 7 ? 'text-yellow-600' : 
                'text-gray-800'
              }`}>
                {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` :
                 daysRemaining === 0 ? 'Due today' :
                 `${daysRemaining} days remaining`}
              </p>
            </div>
          </div>

          {/* Project Metadata */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Project Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Created</p>
                <p className="text-gray-900">
                  {formatDateTime(project.created_at)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Last Updated</p>
                <p className="text-gray-900">
                  {formatDateTime(project.updated_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Project Progress (placeholder for future enhancement) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Flag className="h-5 w-5" />
              <span>Project Progress</span>
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">
                Progress tracking will be available in future updates. 
                This will include task completion, milestone tracking, and team member contributions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
