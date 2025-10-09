'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Calendar, Clock, CheckCircle, AlertCircle, Eye, RefreshCw, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  getTeamMembersWithActivity, 
  getEmployeeActivityDetails,
  type TeamMemberWithActivity,
  type EmployeeActivityDetails 
} from '@/lib/team'
import { toast } from 'sonner'

interface TeamActivityDashboardProps {
  managerId: string
}

export function TeamActivityDashboard({ managerId }: TeamActivityDashboardProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithActivity[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<TeamMemberWithActivity | null>(null)
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeActivityDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [activeView, setActiveView] = useState<'overview' | 'details'>('overview')

  const fetchTeamData = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getTeamMembersWithActivity(managerId)
      setTeamMembers(data)
    } catch (error) {
      console.error('Error fetching team data:', error)
      toast.error('Failed to load team data')
    } finally {
      setIsLoading(false)
    }
  }, [managerId])

  const fetchEmployeeDetails = useCallback(async (employeeId: string) => {
    try {
      setIsLoadingDetails(true)
      const details = await getEmployeeActivityDetails(employeeId)
      setEmployeeDetails(details)
    } catch (error) {
      console.error('Error fetching employee details:', error)
      toast.error('Failed to load employee details')
    } finally {
      setIsLoadingDetails(false)
    }
  }, [])

  useEffect(() => {
    fetchTeamData()
  }, [fetchTeamData])

  const handleEmployeeClick = (employee: TeamMemberWithActivity) => {
    setSelectedEmployee(employee)
    setActiveView('details')
    fetchEmployeeDetails(employee.id)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Activity Dashboard
          </CardTitle>
          <CardDescription>Real-time team activity and performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Activity Dashboard</h1>
          <p className="text-gray-600">Real-time team activity and performance data</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchTeamData}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'overview' | 'details')}>
        <TabsList>
          <TabsTrigger value="overview">Team Overview</TabsTrigger>
          {selectedEmployee && (
            <TabsTrigger value="details">
              {selectedEmployee.full_name} Details
            </TabsTrigger>
          )}
        </TabsList>

        {/* Team Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {teamMembers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No team members found</p>
                <p className="text-sm text-gray-400">Team members will appear here when assigned</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((member) => (
                <Card 
                  key={member.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleEmployeeClick(member)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{member.full_name}</CardTitle>
                        <CardDescription>{member.position || member.role}</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Activity Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>{member.activity.totalLeaves} Leaves</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span>{member.activity.totalHoursThisWeek}h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-600" />
                        <span>{member.activity.completedTasks} Tasks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span>{member.activity.activeTasks} Active</span>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      {member.activity.pendingLeaves > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {member.activity.pendingLeaves} Pending
                        </Badge>
                      )}
                      {member.activity.approvedLeaves > 0 && (
                        <Badge className="bg-green-100 text-green-800">
                          {member.activity.approvedLeaves} Approved
                        </Badge>
                      )}
                    </div>

                    {/* Last Activity */}
                    <div className="text-xs text-gray-500">
                      Last activity: {formatDateTime(member.activity.lastActivity)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Employee Details Tab */}
        <TabsContent value="details" className="space-y-6">
          {selectedEmployee && (
            <>
              {/* Employee Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{selectedEmployee.full_name}</CardTitle>
                      <CardDescription>
                        {selectedEmployee.position || selectedEmployee.role} • {selectedEmployee.department}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setActiveView('overview')}
                    >
                      Back to Overview
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Employee Details Content */}
              {isLoadingDetails ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-32 bg-gray-200 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : employeeDetails ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Leave Requests */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Leave Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {employeeDetails.leaveRequests.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No leave requests</p>
                      ) : (
                        <div className="space-y-3">
                          {employeeDetails.leaveRequests.slice(0, 5).map((request) => (
                            <div key={request.id} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">
                                  {(request.leave_types as { name?: string })?.name || 'Leave'}
                                </span>
                                <Badge className={getStatusColor(request.status)}>
                                  {request.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                {formatDate(request.start_date)} - {formatDate(request.end_date)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Applied: {formatDateTime(request.applied_at)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Time Entries */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Time Tracking
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {employeeDetails.timeEntries.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No time tracking entries</p>
                      ) : (
                        <div className="space-y-3">
                          {employeeDetails.timeEntries.slice(0, 5).map((entry) => (
                            <div key={entry.id} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{formatDate(entry.date)}</span>
                                <span className="text-sm font-medium">{entry.total_hours}h</span>
                              </div>
                              <div className="text-xs text-gray-500 space-y-1">
                                <div>Status: {entry.status}</div>
                                {entry.time_in && (
                                  <div>In: {formatDateTime(entry.time_in)}</div>
                                )}
                                {entry.time_out && (
                                  <div>Out: {formatDateTime(entry.time_out)}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tasks */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Tasks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {employeeDetails.tasks.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No tasks assigned</p>
                      ) : (
                        <div className="space-y-3">
                          {employeeDetails.tasks.slice(0, 10).map((task) => (
                            <div key={task.id} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{task.title}</span>
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(task.status)}>
                                    {task.status}
                                  </Badge>
                                  {task.priority && (
                                    <Badge variant="outline">
                                      {task.priority}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-gray-600">
                                {task.description}
                              </div>
                              <div className="text-xs text-gray-500">
                                Due: {task.due_date ? formatDate(task.due_date) : 'No due date'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Failed to load employee details</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
