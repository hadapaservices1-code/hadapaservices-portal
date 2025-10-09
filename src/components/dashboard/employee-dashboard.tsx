"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  Clock, 
  FileText, 
  Bell, 
  CheckCircle2,
  AlertCircle,
  Users
} from "lucide-react"
import { TimeTrackingCard } from "./time-tracking-card"
import { TimesheetCard } from "./timesheet-card"
import { LeaveSummaryCard } from "./leave-summary-card"
import { getUserTasks, getUserTaskStats, type Task, type TaskStats } from "@/lib/tasks"
import Link from "next/link"

interface EmployeeDashboardProps {
  userName: string
  userDepartment?: string
  userId?: string
}

export function EmployeeDashboard({ userName, userDepartment, userId }: EmployeeDashboardProps) {
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch tasks and stats
  useEffect(() => {
    const fetchTasks = async () => {
      if (!userId) return
      
      try {
        setIsLoading(true)
        const [tasksData, statsData] = await Promise.all([
          getUserTasks(userId),
          getUserTaskStats(userId)
        ])
        setRecentTasks(tasksData.slice(0, 3)) // Show only recent 3 tasks
        setTaskStats(statsData)
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [userId])

  // Dynamic stats based on real data
  const stats = [
    { 
      title: "Tasks Completed", 
      value: taskStats?.completed_tasks?.toString() || "0", 
      change: "+2 this week", 
      icon: CheckCircle2, 
      color: "text-green-600" 
    },
    { 
      title: "Hours Worked", 
      value: "40.5", 
      change: "This week", 
      icon: Clock, 
      color: "text-blue-600" 
    },
    { 
      title: "Pending Tasks", 
      value: taskStats?.pending_tasks?.toString() || "0", 
      change: "Due this week", 
      icon: AlertCircle, 
      color: "text-orange-600" 
    },
    { 
      title: "Team Members", 
      value: "8", 
      change: "In your department", 
      icon: Users, 
      color: "text-purple-600" 
    },
  ]

  const upcomingEvents = [
    { title: "Team Standup", time: "9:00 AM", date: "Today" },
    { title: "Project Review", time: "2:00 PM", date: "Tomorrow" },
    { title: "Department Meeting", time: "10:00 AM", date: "Friday" },
  ]

  const announcements = [
    { title: "New company policy update", content: "Please review the updated remote work policy in your email.", urgent: false },
    { title: "System maintenance", content: "The portal will be under maintenance this weekend.", urgent: true },
    { title: "Holiday schedule", content: "Upcoming holidays and office closures for Q1.", urgent: false },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {userName}!</h1>
        <p className="text-blue-100">
          {userDepartment ? `Here's what's happening in ${userDepartment}` : "Here's your dashboard overview"}
        </p>
      </div>

      {/* Time Tracking Card */}
      {userId && (
        <TimeTrackingCard userId={userId} userName={userName} />
      )}

      {/* Timesheet Card */}
      {userId && (
        <TimesheetCard userId={userId} userName={userName} />
      )}

      {/* Leave Summary Card */}
      {userId && (
        <LeaveSummaryCard employeeId={userId} userRole="employee" />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.change}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Recent Tasks</span>
            </CardTitle>
            <CardDescription>Your latest task updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading tasks...</p>
                </div>
              ) : recentTasks.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No tasks assigned yet</p>
                </div>
              ) : (
                recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : task.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.priority === 'urgent' || task.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : task.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Due: {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'No due date'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link href="/dashboard/tasks">
              <Button className="w-full mt-4" variant="outline">
                View All Tasks
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Upcoming Events</span>
            </CardTitle>
            <CardDescription>Your schedule for the next few days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-500">{event.time} • {event.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4" variant="outline">
              View Calendar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Announcements</span>
          </CardTitle>
          <CardDescription>Important updates and news</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {announcements.map((announcement, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                announcement.urgent 
                  ? 'bg-red-50 border-red-400' 
                  : 'bg-blue-50 border-blue-400'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    announcement.urgent ? 'bg-red-400' : 'bg-blue-400'
                  }`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
