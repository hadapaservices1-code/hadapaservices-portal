'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, CheckCircle, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getManagerPendingRequests, getManagerPendingRequestsServer, type LeaveRequestWithDetails } from '@/lib/leave'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ManagerLeaveSummaryProps {
  managerId: string
}

export function ManagerLeaveSummary({ managerId }: ManagerLeaveSummaryProps) {
  const [pendingRequests, setPendingRequests] = useState<LeaveRequestWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchPendingRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      // Try server-side function first, fallback to client-side
      let data: LeaveRequestWithDetails[] = []
      try {
        data = await getManagerPendingRequestsServer(managerId)
      } catch (serverError) {
        console.log('Server-side function failed, trying client-side:', serverError)
        data = await getManagerPendingRequests(managerId)
      }
      setPendingRequests(data.slice(0, 3)) // Show only recent 3
    } catch (error) {
      console.error('Error fetching pending requests:', error)
    } finally {
      setIsLoading(false)
    }
  }, [managerId])

  useEffect(() => {
    fetchPendingRequests()
  }, [fetchPendingRequests])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Requests
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
              Leave Requests
            </CardTitle>
            <CardDescription>Pending leave requests from your team</CardDescription>
          </div>
          <Link href="/dashboard/leave">
            <Button size="sm">
              <Users className="h-4 w-4 mr-1" />
              Manage
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-xs text-gray-600">Approved Today</div>
            </div>
          </div>

          {/* Recent Requests */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Recent Requests</h4>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No pending requests</p>
                <p className="text-xs text-gray-400">All caught up! 🎉</p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{request.employee_name}</span>
                      <Badge className="text-xs bg-yellow-100 text-yellow-800">
                        {request.leave_type_name}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      {formatDate(request.start_date)} - {formatDate(request.end_date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {formatDateTime(request.applied_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* View All Link */}
          {pendingRequests.length > 0 && (
            <div className="pt-2 border-t">
              <Link href="/dashboard/leave" className="w-full">
                <Button variant="ghost" size="sm" className="w-full">
                  Review All Requests
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
