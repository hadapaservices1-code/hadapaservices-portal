"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateProjectModal } from "./create-project-modal"
import { AddTeamMemberModal } from "./add-team-member-modal"
import { ScheduleMeetingModal } from "./schedule-meeting-modal"
import { TeamSettingsModal } from "./team-settings-modal"
import { ManageTeamModal } from "./manage-team-modal"
import { ViewActivitiesModal } from "./view-activities-modal"
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  BarChart3,
  FileText
} from "lucide-react"

interface ManagerDashboardProps {
  userName: string
  userDepartment?: string
}

export function ManagerDashboard({ userName, userDepartment }: ManagerDashboardProps) {
  const [, setRefreshKey] = useState(0)
  
  // Mock data - in real app, this would come from Supabase
  const teamStats = [
    { title: "Team Members", value: "12", change: "+2 this month", icon: Users, color: "text-blue-600" },
    { title: "Tasks Completed", value: "48", change: "+15% vs last month", icon: CheckCircle2, color: "text-green-600" },
    { title: "Active Projects", value: "6", change: "3 in progress", icon: FileText, color: "text-purple-600" },
    { title: "Team Productivity", value: "92%", change: "+5% this week", icon: TrendingUp, color: "text-orange-600" },
  ]

  const teamMembers = [
    { id: 1, name: "Sarah Johnson", role: "Senior Developer", status: "Online", tasks: 8, completed: 6 },
    { id: 2, name: "Mike Chen", role: "UI/UX Designer", status: "Away", tasks: 5, completed: 4 },
    { id: 3, name: "Emily Davis", role: "Project Manager", status: "Online", tasks: 12, completed: 10 },
    { id: 4, name: "Alex Rodriguez", role: "Backend Developer", status: "Offline", tasks: 6, completed: 3 },
  ]

  const recentActivities = [
    { id: 1, user: "Sarah Johnson", action: "completed task", task: "User authentication module", time: "2 hours ago" },
    { id: 2, user: "Mike Chen", action: "uploaded file", task: "Design mockups v2", time: "4 hours ago" },
    { id: 3, user: "Emily Davis", action: "created project", task: "Q1 Marketing Campaign", time: "6 hours ago" },
    { id: 4, user: "Alex Rodriguez", action: "commented on", task: "Database optimization", time: "8 hours ago" },
  ]

  const upcomingDeadlines = [
    { project: "Mobile App Launch", deadline: "Jan 20, 2024", status: "On Track", priority: "High" },
    { project: "Q1 Report", deadline: "Jan 25, 2024", status: "At Risk", priority: "Medium" },
    { project: "Team Training", deadline: "Jan 30, 2024", status: "On Track", priority: "Low" },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome, {userName}!</h1>
        <p className="text-purple-100">
          {userDepartment ? `Manage your ${userDepartment} team` : "Manage your team and projects"}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AddTeamMemberModal onMemberAdded={() => setRefreshKey(prev => prev + 1)} />
        <CreateProjectModal onProjectCreated={() => setRefreshKey(prev => prev + 1)} />
        <ScheduleMeetingModal onMeetingScheduled={() => setRefreshKey(prev => prev + 1)} />
        <TeamSettingsModal onSettingsUpdated={() => setRefreshKey(prev => prev + 1)} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {teamStats.map((stat, index) => {
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
        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Team Members</span>
            </CardTitle>
            <CardDescription>Your team&apos;s current status and workload</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{member.name}</h4>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`w-3 h-3 rounded-full ${
                      member.status === 'Online' ? 'bg-green-400' : 
                      member.status === 'Away' ? 'bg-yellow-400' : 'bg-gray-400'
                    }`} />
                    <p className="text-sm text-gray-500 mt-1">
                      {member.completed}/{member.tasks} tasks
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <ManageTeamModal onTeamUpdated={() => setRefreshKey(prev => prev + 1)} />
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activities</span>
            </CardTitle>
            <CardDescription>Latest updates from your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user}</span> {activity.action} <span className="font-medium">{activity.task}</span>
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <ViewActivitiesModal onActivitiesUpdated={() => setRefreshKey(prev => prev + 1)} />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>Upcoming Deadlines</span>
          </CardTitle>
          <CardDescription>Projects and tasks that need attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingDeadlines.map((deadline, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{deadline.project}</h4>
                  <p className="text-sm text-gray-500">Due: {deadline.deadline}</p>
                </div>
                <div className="flex items-center space-x-3">
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
                    deadline.priority === 'High' 
                      ? 'bg-red-100 text-red-800'
                      : deadline.priority === 'Medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {deadline.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Team Analytics</span>
          </CardTitle>
          <CardDescription>Performance insights and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Productivity</h3>
              <p className="text-2xl font-bold text-green-600">+12%</p>
              <p className="text-sm text-gray-500">vs last month</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Completion Rate</h3>
              <p className="text-2xl font-bold text-blue-600">94%</p>
              <p className="text-sm text-gray-500">this month</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Team Satisfaction</h3>
              <p className="text-2xl font-bold text-purple-600">4.8/5</p>
              <p className="text-sm text-gray-500">average rating</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
