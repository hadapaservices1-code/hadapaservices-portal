'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, Users, TrendingUp, Eye, RefreshCw, CheckCircle, AlertCircle, Timer } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getTeamTimeTrackingSummary, type ManagerTimeTrackingSummary } from '@/lib/time-tracking'
import { toast } from 'sonner'

interface ManagerTimeTrackingSummaryProps {
  managerId: string
  onViewDetails?: () => void
}

export function ManagerTimeTrackingSummary({ managerId, onViewDetails }: ManagerTimeTrackingSummaryProps) {
  const [timeTrackingData, setTimeTrackingData] = useState<ManagerTimeTrackingSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [summaryStats, setSummaryStats] = useState({
    totalEmployees: 0,
    clockedInNow: 0,
    totalHoursToday: 0,
    totalHoursThisWeek: 0,
    averageHoursPerEmployee: 0
  })

  const fetchTimeTrackingData = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getTeamTimeTrackingSummary(managerId)
      setTimeTrackingData(data)

      // Calculate summary statistics
      const totalEmployees = data.length
      const clockedInNow = data.filter(emp => emp.todayStatus === 'clocked_in').length
      const totalHoursToday = data.reduce((total, emp) => total + emp.todayHours, 0)
      const totalHoursThisWeek = data.reduce((total, emp) => total + emp.weeklyHours, 0)
      const averageHoursPerEmployee = totalEmployees > 0 ? totalHoursThisWeek / totalEmployees : 0

      setSummaryStats({
        totalEmployees,
        clockedInNow,
        totalHoursToday,
        totalHoursThisWeek,
        averageHoursPerEmployee
      })
    } catch (error) {
      console.error('Error fetching time tracking data:', error)
      toast.error('Failed to load time tracking data')
    } finally {
      setIsLoading(false)
    }
  }, [managerId])

  useEffect(() => {
    fetchTimeTrackingData()
  }, [fetchTimeTrackingData])

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Team Time Tracking
          </CardTitle>
          <CardDescription>Real-time time tracking overview for your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Team Time Tracking
            </CardTitle>
            <CardDescription>Real-time time tracking overview for your team</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTimeTrackingData}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewDetails}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summaryStats.totalEmployees}</div>
            <div className="text-sm text-gray-500">Total Employees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summaryStats.clockedInNow}</div>
            <div className="text-sm text-gray-500">Currently Working</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{summaryStats.totalHoursToday.toFixed(1)}h</div>
            <div className="text-sm text-gray-500">Today's Hours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{summaryStats.totalHoursThisWeek.toFixed(1)}h</div>
            <div className="text-sm text-gray-500">This Week</div>
          </div>
        </div>

        {/* Employee List */}
        {timeTrackingData.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No team members found</p>
            <p className="text-sm text-gray-400">Time tracking data will appear here when available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {timeTrackingData.slice(0, 5).map((employee) => (
              <div
                key={employee.employeeId}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(employee.todayStatus)}
                    <div>
                      <h4 className="font-medium text-gray-900">{employee.employeeName}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Today: {employee.todayHours.toFixed(1)}h</span>
                        <span>•</span>
                        <span>Week: {employee.weeklyHours.toFixed(1)}h</span>
                      </div>
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
            ))}

            {timeTrackingData.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" onClick={onViewDetails}>
                  View All {timeTrackingData.length} Employees
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
