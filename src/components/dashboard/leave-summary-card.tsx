'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, AlertCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getEmployeeLeaveRequests, getLeaveStatistics, type LeaveRequestWithDetails, type LeaveStats } from '@/lib/leave'
import Link from 'next/link'

interface LeaveSummaryCardProps {
  employeeId: string
  userRole: 'employee' | 'manager' | 'admin'
}

export function LeaveSummaryCard({ employeeId, userRole }: LeaveSummaryCardProps) {
  const [recentRequests, setRecentRequests] = useState<LeaveRequestWithDetails[]>([])
  const [stats, setStats] = useState<LeaveStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchEmployeeData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [requestsData, statsData] = await Promise.all([
        getEmployeeLeaveRequests(employeeId),
        getLeaveStatistics(employeeId)
      ])
      setRecentRequests(requestsData.slice(0, 3)) // Show only recent 3
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching leave data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [employeeId])

  useEffect(() => {
    if (userRole === 'employee') {
      fetchEmployeeData()
    }
  }, [employeeId, userRole, fetchEmployeeData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (userRole !== 'employee') {
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
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
              <Calendar className="h-5 w-5" />
              Leave Summary
            </CardTitle>
            <CardDescription>Your recent leave activity</CardDescription>
          </div>
          <Link href="/dashboard/leave">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.approved_requests}</div>
                <div className="text-xs text-gray-600">Approved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending_requests}</div>
                <div className="text-xs text-gray-600">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.total_days_taken}</div>
                <div className="text-xs text-gray-600">Days Taken</div>
              </div>
            </div>
          )}

          {/* Recent Requests */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Recent Requests</h4>
            {recentRequests.length === 0 ? (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No leave requests yet</p>
                <Link href="/dashboard/leave">
                  <Button size="sm" variant="outline" className="mt-2">
                    Submit First Request
                  </Button>
                </Link>
              </div>
            ) : (
              recentRequests.map((request) => (
                <div key={(request as LeaveRequestWithDetails & { id: string }).id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{request.leave_type_name}</span>
                      <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      {formatDate(request.start_date)} - {formatDate(request.end_date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {new Date(request.applied_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* View All Link */}
          {recentRequests.length > 0 && (
            <div className="pt-2 border-t">
              <Link href="/dashboard/leave" className="w-full">
                <Button variant="ghost" size="sm" className="w-full">
                  View All Requests
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
