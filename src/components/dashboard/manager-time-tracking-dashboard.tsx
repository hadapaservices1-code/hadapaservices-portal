'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, ArrowLeft, RefreshCw, Calendar, TrendingUp, Timer, CheckCircle, AlertCircle, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  getTeamTimeTrackingSummary, 
  getEmployeeTimeTrackingDetails,
  type ManagerTimeTrackingSummary,
  type ManagerTimeTrackingDetails 
} from '@/lib/time-tracking'
import { toast } from 'sonner'

interface ManagerTimeTrackingDashboardProps {
  managerId: string
  onBack?: () => void
}

export function ManagerTimeTrackingDashboard({ managerId, onBack }: ManagerTimeTrackingDashboardProps) {
  const [timeTrackingData, setTimeTrackingData] = useState<ManagerTimeTrackingSummary[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<ManagerTimeTrackingSummary | null>(null)
  const [employeeDetails, setEmployeeDetails] = useState<ManagerTimeTrackingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [activeView, setActiveView] = useState<'overview' | 'details'>('overview')

  const fetchTimeTrackingData = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getTeamTimeTrackingSummary(managerId)
      setTimeTrackingData(data)
    } catch (error) {
      console.error('Error fetching time tracking data:', error)
      toast.error('Failed to load time tracking data')
    } finally {
      setIsLoading(false)
    }
  }, [managerId])

  const fetchEmployeeDetails = useCallback(async (employeeId: string) => {
    try {
      setIsLoadingDetails(true)
      const details = await getEmployeeTimeTrackingDetails(employeeId)
      setEmployeeDetails(details)
    } catch (error) {
      console.error('Error fetching employee details:', error)
      toast.error('Failed to load employee details')
    } finally {
      setIsLoadingDetails(false)
    }
  }, [])

  useEffect(() => {
    fetchTimeTrackingData()
  }, [fetchTimeTrackingData])

  const handleEmployeeClick = (employee: ManagerTimeTrackingSummary) => {
    setSelectedEmployee(employee)
    setActiveView('details')
    fetchEmployeeDetails(employee.employeeId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clocked_in':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'clocked_out':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'on_break':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'not_tracked':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'clocked_in':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'clocked_out':
        return <Clock className="h-4 w-4 text-gray-600" />
      case 'on_break':
        return <Timer className="h-4 w-4 text-yellow-600" />
      case 'not_tracked':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'N/A'
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <h1 className="text-2xl font-bold">Team Time Tracking</h1>
        </div>
        <Card>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (activeView === 'details' && selectedEmployee && employeeDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setActiveView('overview')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
          <h1 className="text-2xl font-bold">{selectedEmployee.employeeName} - Time Tracking</h1>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">Time History</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(selectedEmployee.todayStatus)}
                    Current Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge className={getStatusColor(selectedEmployee.todayStatus)}>
                      {selectedEmployee.todayStatus.replace('_', ' ')}
                    </Badge>
                    {selectedEmployee.currentSessionDuration && (
                      <div className="text-sm text-gray-600">
                        Session: {formatDuration(selectedEmployee.currentSessionDuration)}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      Last In: {formatTime(selectedEmployee.lastClockIn)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Last Out: {formatTime(selectedEmployee.lastClockOut)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Today's Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Today's Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {selectedEmployee.todayHours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedEmployee.todayStatus === 'clocked_in' ? 'Currently working' : 'Completed'}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    This Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {selectedEmployee.weeklyHours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-gray-500">
                    Avg: {(selectedEmployee.weeklyHours / 7).toFixed(1)}h/day
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Time Tracking History</CardTitle>
                <CardDescription>Recent time tracking entries</CardDescription>
              </CardHeader>
              <CardContent>
                {employeeDetails.timeEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No time tracking entries found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {employeeDetails.timeEntries.slice(0, 20).map((entry) => (
                      <div key={entry.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(entry.status)}>
                              {entry.status.replace('_', ' ')}
                            </Badge>
                            <span className="font-medium">{formatDate(entry.date)}</span>
                          </div>
                          <span className="text-lg font-bold text-blue-600">
                            {entry.totalHours.toFixed(1)}h
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Clock In:</span> {formatTime(entry.timeIn)}
                          </div>
                          <div>
                            <span className="font-medium">Clock Out:</span> {formatTime(entry.timeOut)}
                          </div>
                        </div>
                        {entry.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {entry.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Summary</CardTitle>
                <CardDescription>Weekly time tracking breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {employeeDetails.weeklySummary.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No weekly data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {employeeDetails.weeklySummary.map((week, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-medium">
                              Week of {formatDate(week.weekStart)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {week.daysWorked} days worked
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              {week.totalHours.toFixed(1)}h
                            </div>
                            <div className="text-sm text-gray-500">
                              Avg: {week.averageHoursPerDay.toFixed(1)}h/day
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <h1 className="text-2xl font-bold">Team Time Tracking</h1>
        </div>
        <Button
          variant="outline"
          onClick={fetchTimeTrackingData}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {timeTrackingData.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No team members found</p>
              <p className="text-sm text-gray-400">Time tracking data will appear here when available</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {timeTrackingData.map((employee) => (
            <Card key={employee.employeeId} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4" onClick={() => handleEmployeeClick(employee)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(employee.todayStatus)}
                    <div>
                      <h3 className="font-medium text-gray-900">{employee.employeeName}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Today: {employee.todayHours.toFixed(1)}h</span>
                        <span>Week: {employee.weeklyHours.toFixed(1)}h</span>
                        <span>Month: {employee.monthlyHours.toFixed(1)}h</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(employee.todayStatus)}>
                      {employee.todayStatus.replace('_', ' ')}
                    </Badge>
                    
                    {employee.currentSessionDuration && (
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {formatDuration(employee.currentSessionDuration)}
                        </div>
                      </div>
                    )}

                    <div className="text-right text-sm text-gray-500">
                      <div>Last In: {formatTime(employee.lastClockIn)}</div>
                      <div>Last Out: {formatTime(employee.lastClockOut)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
