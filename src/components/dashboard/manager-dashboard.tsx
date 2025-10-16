"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateProjectModal } from "./create-project-modal"
import { AddTeamMemberModal } from "./add-team-member-modal"
import { ScheduleMeetingModal } from "./schedule-meeting-modal"
import { TeamSettingsModal } from "./team-settings-modal"
import { ManageTeamModal } from "./manage-team-modal"
import { ViewActivitiesModal } from "./view-activities-modal"
import { ManagerLeaveSummary } from "./manager-leave-summary"
import { TeamActivitySummary } from "./team-activity-summary"
import { ManagerTimeTrackingSummary } from "./manager-time-tracking-summary"
import { ExpenseSummaryCard } from "@/components/expense/expense-summary-card"
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  BarChart3,
  FileText
} from "lucide-react"
import { 
  getTeamMembers, 
  getTeamStats, 
  getRecentTeamActivities, 
  getUpcomingDeadlines,
  type TeamMember,
  type TeamStats 
} from "@/lib/team"

interface ManagerDashboardProps {
  userName: string
  userDepartment?: string
  userId: string
}

export function ManagerDashboard({ userName, userDepartment, userId }: ManagerDashboardProps) {
  const [, setRefreshKey] = useState(0)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<{
    id: string
    user: string
    action: string
    task: string
    time: string
  }[]>([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<{
    project: string
    deadline: string
    status: string
    priority: string
  }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch real data from database
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return
      
      try {
        setIsLoading(true)
        
        // Fetch data with individual error handling
        const [membersResult, statsResult, activitiesResult, deadlinesResult] = await Promise.allSettled([
          getTeamMembers(userId),
          getTeamStats(userId),
          getRecentTeamActivities(userId),
          getUpcomingDeadlines(userId)
        ])
        
        // Handle each result individually
        if (membersResult.status === 'fulfilled') {
          setTeamMembers(membersResult.value)
        } else {
          console.error('Error fetching team members:', membersResult.reason)
          setTeamMembers([])
        }
        
        if (statsResult.status === 'fulfilled') {
          setTeamStats(statsResult.value)
        } else {
          console.error('Error fetching team stats:', statsResult.reason)
          setTeamStats(null)
        }
        
        if (activitiesResult.status === 'fulfilled') {
          setRecentActivities(activitiesResult.value)
        } else {
          console.error('Error fetching recent activities:', activitiesResult.reason)
          setRecentActivities([])
        }
        
        if (deadlinesResult.status === 'fulfilled') {
          setUpcomingDeadlines(deadlinesResult.value)
        } else {
          console.error('Error fetching upcoming deadlines:', deadlinesResult.reason)
          setUpcomingDeadlines([])
        }
      } catch (error) {
        console.error('Error in fetchData:', error)
        // Set empty states to prevent crashes
        setTeamMembers([])
        setTeamStats(null)
        setRecentActivities([])
        setUpcomingDeadlines([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [userId])

  // Format team stats for display
  const displayStats = teamStats ? [
    { 
      title: "Team Members", 
      value: (teamStats.total_members || 0).toString(), 
      change: `+${teamStats.active_members || 0} active`, 
      icon: Users, 
      color: "text-blue-600" 
    },
    { 
      title: "Tasks Completed", 
      value: (teamStats.completed_tasks || 0).toString(), 
      change: `${teamStats.productivity_rate || 0}% completion rate`, 
      icon: CheckCircle2, 
      color: "text-green-600" 
    },
    { 
      title: "Total Tasks", 
      value: (teamStats.total_tasks || 0).toString(), 
      change: "All time", 
      icon: FileText, 
      color: "text-purple-600" 
    },
    { 
      title: "Team Productivity", 
      value: `${teamStats.productivity_rate || 0}%`, 
      change: "Completion rate", 
      icon: TrendingUp, 
      color: "text-orange-600" 
    },
  ] : [
    { title: "Team Members", value: "0", change: "Loading...", icon: Users, color: "text-blue-600" },
    { title: "Tasks Completed", value: "0", change: "Loading...", icon: CheckCircle2, color: "text-green-600" },
    { title: "Active Projects", value: "0", change: "Loading...", icon: FileText, color: "text-purple-600" },
    { title: "Team Productivity", value: "0%", change: "Loading...", icon: TrendingUp, color: "text-orange-600" },
  ]

  return (
    <div className="space-y-4">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4 text-white">
        <h1 className="text-lg font-semibold mb-1">Welcome, {userName}!</h1>
        <p className="text-sm text-purple-100">
          {userDepartment ? `Manage your ${userDepartment} team` : "Manage your team and projects"}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <AddTeamMemberModal onMemberAdded={() => setRefreshKey(prev => prev + 1)} />
        <CreateProjectModal onProjectCreated={() => setRefreshKey(prev => prev + 1)} />
        <ScheduleMeetingModal onMeetingScheduled={() => setRefreshKey(prev => prev + 1)} />
        <TeamSettingsModal onSettingsUpdated={() => setRefreshKey(prev => prev + 1)} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">{stat.title}</p>
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.change}</p>
                  </div>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Leave Management Summary */}
      {userId && (
        <ManagerLeaveSummary managerId={userId} />
      )}

      {/* Team Activity Summary */}
      {userId && (
        <TeamActivitySummary
          managerId={userId}
          onViewDetails={() => {
            // This will be handled by navigation to the team activity page
            window.location.href = '/dashboard/team-activity'
          }}
        />
      )}

      {/* Time Tracking Summary */}
      {userId && (
        <ManagerTimeTrackingSummary
          managerId={userId}
          onViewDetails={() => {
            // This will be handled by navigation to the time tracking page
            window.location.href = '/dashboard/time-tracking'
          }}
        />
      )}

      {/* Expense Management Summary */}
      {userId && (
        <ExpenseSummaryCard
          userId={userId}
          userRole="manager"
          onViewExpenses={() => window.location.href = '/dashboard/expenses'}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Team Members */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Users className="h-4 w-4" />
              <span>Team Members</span>
            </CardTitle>
            <CardDescription className="text-sm">Your team&apos;s current status and workload</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg animate-pulse">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                      <div>
                        <div className="h-3 bg-gray-300 rounded w-20 mb-1"></div>
                        <div className="h-2 bg-gray-300 rounded w-14"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mb-1"></div>
                      <div className="h-2 bg-gray-300 rounded w-10"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : teamMembers.length > 0 ? (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-xs">
                          {member.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-900">{member.full_name || 'Unknown User'}</h4>
                        <p className="text-xs text-gray-500">{member.position || member.role}</p>
                        <p className="text-xs text-gray-400">{member.department || 'No department'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${
                          member.status === 'online' ? 'bg-green-400' :
                          member.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                        }`} />
                        <span className="text-xs text-gray-500">
                          {member.manager_id ? 'Assigned' : 'Available'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {member.completed_tasks || 0}/{member.task_count || 0} tasks
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No employees found</p>
                <p className="text-xs text-gray-400">Employees will appear here when they register</p>
              </div>
            )}
            <ManageTeamModal onTeamUpdated={() => setRefreshKey(prev => prev + 1)} />
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Clock className="h-4 w-4" />
              <span>Recent Activities</span>
            </CardTitle>
            <CardDescription className="text-sm">Latest updates from your team</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg animate-pulse">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-300 rounded w-3/4 mb-1"></div>
                      <div className="h-2 bg-gray-300 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-900">
                      <span className="font-medium">{activity.user}</span> {activity.action} <span className="font-medium">{activity.task}</span>
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No recent activities</p>
                <p className="text-xs text-gray-400">Team activities will appear here</p>
              </div>
            )}
            <ViewActivitiesModal onActivitiesUpdated={() => setRefreshKey(prev => prev + 1)} />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base">
            <AlertCircle className="h-4 w-4" />
            <span>Upcoming Deadlines</span>
          </CardTitle>
          <CardDescription className="text-sm">Projects and tasks that need attention</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                  <div className="flex-1">
                    <div className="h-3 bg-gray-300 rounded w-1/2 mb-1"></div>
                    <div className="h-2 bg-gray-300 rounded w-1/3"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-5 bg-gray-300 rounded-full w-12"></div>
                    <div className="h-5 bg-gray-300 rounded-full w-10"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingDeadlines.length > 0 ? (
          <div className="space-y-3">
            {upcomingDeadlines.map((deadline, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-gray-900">{deadline.project}</h4>
                  <p className="text-xs text-gray-500">Due: {deadline.deadline}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    deadline.status === 'On Track'
                      ? 'bg-green-100 text-green-800'
                      : deadline.status === 'At Risk'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {deadline.status}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                      deadline.priority === 'high'
                      ? 'bg-red-100 text-red-800'
                        : deadline.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {deadline.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No upcoming deadlines</p>
              <p className="text-xs text-gray-400">Project deadlines will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base">
            <BarChart3 className="h-4 w-4" />
            <span>Team Analytics</span>
          </CardTitle>
          <CardDescription className="text-sm">Performance insights and trends</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-sm text-gray-900">Productivity</h3>
              <p className="text-lg font-bold text-green-600">+12%</p>
              <p className="text-xs text-gray-500">vs last month</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-sm text-gray-900">Completion Rate</h3>
              <p className="text-lg font-bold text-blue-600">94%</p>
              <p className="text-xs text-gray-500">this month</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-sm text-gray-900">Team Satisfaction</h3>
              <p className="text-lg font-bold text-purple-600">4.8/5</p>
              <p className="text-xs text-gray-500">average rating</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
