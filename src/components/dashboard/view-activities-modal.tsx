"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Clock, Search, Calendar, User, FileText, MessageSquare, CheckCircle2 } from "lucide-react"

interface Activity {
  id: number
  user: string
  action: string
  task: string
  time: string
  type: "task" | "file" | "project" | "comment"
  priority: "low" | "medium" | "high"
}

interface ViewActivitiesModalProps {
  onActivitiesUpdated?: () => void
}

export function ViewActivitiesModal({ onActivitiesUpdated }: ViewActivitiesModalProps) {
  // onActivitiesUpdated callback for future use
  console.log("Activities modal opened", onActivitiesUpdated)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  
  const [activities] = useState<Activity[]>([
    { id: 1, user: "Sarah Johnson", action: "completed task", task: "User authentication module", time: "2 hours ago", type: "task", priority: "high" },
    { id: 2, user: "Mike Chen", action: "uploaded file", task: "Design mockups v2", time: "4 hours ago", type: "file", priority: "medium" },
    { id: 3, user: "Emily Davis", action: "created project", task: "Q1 Marketing Campaign", time: "6 hours ago", type: "project", priority: "high" },
    { id: 4, user: "Alex Rodriguez", action: "commented on", task: "Database optimization", time: "8 hours ago", type: "comment", priority: "low" },
    { id: 5, user: "Sarah Johnson", action: "updated status", task: "API integration", time: "1 day ago", type: "task", priority: "medium" },
    { id: 6, user: "Mike Chen", action: "shared document", task: "User research findings", time: "1 day ago", type: "file", priority: "low" },
    { id: 7, user: "Emily Davis", action: "assigned task", task: "Code review for mobile app", time: "2 days ago", type: "task", priority: "high" },
    { id: 8, user: "Alex Rodriguez", action: "completed milestone", task: "Backend API v2.0", time: "2 days ago", type: "project", priority: "high" },
  ])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "file":
        return <FileText className="h-4 w-4 text-blue-600" />
      case "project":
        return <Calendar className="h-4 w-4 text-purple-600" />
      case "comment":
        return <MessageSquare className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.action.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || activity.type === filterType
    return matchesSearch && matchesFilter
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full mt-4" variant="outline">
          View All Activities
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Team Activities</span>
          </DialogTitle>
          <DialogDescription>
            View all team activities and updates in chronological order.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
              >
                All
              </Button>
              <Button
                variant={filterType === "task" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("task")}
              >
                Tasks
              </Button>
              <Button
                variant={filterType === "project" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("project")}
              >
                Projects
              </Button>
              <Button
                variant={filterType === "file" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("file")}
              >
                Files
              </Button>
            </div>
          </div>

          {/* Activities List */}
          <div className="space-y-3">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No activities found matching your criteria.
              </div>
            ) : (
              filteredActivities.map((activity) => (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{activity.user}</span>
                            <span className="text-gray-600">{activity.action}</span>
                            <span className="font-medium text-gray-900">{activity.task}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(activity.priority)}>
                              {activity.priority}
                            </Badge>
                            <span className="text-sm text-gray-500">{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {filteredActivities.length} of {activities.length} activities
            </div>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
