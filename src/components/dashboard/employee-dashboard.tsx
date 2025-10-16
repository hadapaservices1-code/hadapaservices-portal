"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  Clock, 
  FileText, 
  Bell, 
  CheckCircle2,
  AlertCircle,
  Users,
  Sparkles
} from "lucide-react"
import { TimeTrackingCard } from "./time-tracking-card"
import { TimesheetCard } from "./timesheet-card"
import { LeaveSummaryCard } from "./leave-summary-card"
import { ExpenseSummaryCard } from "@/components/expense/expense-summary-card"
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
      value: taskStats?.total_tasks ? `${taskStats.total_tasks * 8}` : "0", 
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
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Welcome Section */}
      <motion.div 
        className="glass border-glass-border rounded-2xl p-6 relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-primary opacity-90"
          animate={{ 
            background: [
              "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(262 83% 58%) 100%)",
              "linear-gradient(135deg, hsl(262 83% 58%) 0%, hsl(188 100% 50%) 100%)",
              "linear-gradient(135deg, hsl(188 100% 50%) 0%, hsl(217 91% 60%) 100%)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Floating particles effect */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>

        <div className="relative z-10">
          <motion.h1 
            className="text-2xl font-bold mb-2 text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            Welcome back, {userName}! 
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="inline-block ml-2"
            >
              👋
            </motion.span>
          </motion.h1>
          <motion.p 
            className="text-white/90 text-sm flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Sparkles className="h-4 w-4" />
            {userDepartment ? `Here's what's happening in ${userDepartment}` : "Here's your dashboard overview"}
          </motion.p>
        </div>
      </motion.div>

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

      {/* Expense Summary Card */}
      {userId && (
        <ExpenseSummaryCard 
          userId={userId} 
          userRole="employee"
          onViewExpenses={() => window.location.href = '/dashboard/expenses'}
        />
      )}

      {/* Stats Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Card variant="glass" hover className="group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                      <motion.p 
                        className="text-3xl font-bold text-foreground"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6 + index * 0.1, type: "spring", stiffness: 200 }}
                      >
                        {stat.value}
                      </motion.p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Icon className={`h-8 w-8 ${stat.color} group-hover:drop-shadow-lg`} />
                    </motion.div>
                  </div>
                  
                  {/* Animated progress bar */}
                  <motion.div
                    className="mt-4 h-1 bg-muted rounded-full overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    <motion.div
                      className="h-full bg-gradient-primary rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${Math.min(100, parseInt(stat.value) * 10)}%` }}
                      transition={{ delay: 1 + index * 0.1, duration: 1, ease: "easeOut" }}
                    />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

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
                  <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg ${
                    task.is_timesheet_entry ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-gray-50'
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        {task.is_timesheet_entry && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Timesheet
                          </span>
                        )}
                      </div>
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
                        {task.is_timesheet_entry && task.hours_worked && (
                          <span className="text-xs text-blue-600 font-medium">
                            {task.hours_worked}h worked
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {task.is_timesheet_entry ? 'Date: ' : 'Due: '}{task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
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
    </motion.div>
  )
}
