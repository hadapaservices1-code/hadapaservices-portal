'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Filter, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getManagerLeaveHistory, type LeaveRequestWithDetails } from '@/lib/leave'
import { toast } from 'sonner'

interface ManagerLeaveHistoryProps {
  managerId: string
  onRefresh?: () => void
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'

export function ManagerLeaveHistory({ managerId, onRefresh }: ManagerLeaveHistoryProps) {
  const [requests, setRequests] = useState<LeaveRequestWithDetails[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequestWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const fetchLeaveHistory = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getManagerLeaveHistory(managerId)
      setRequests(data)
      setFilteredRequests(data)
    } catch (error) {
      console.error('Error fetching leave history:', error)
      toast.error('Failed to load leave history')
    } finally {
      setIsLoading(false)
    }
  }, [managerId])

  useEffect(() => {
    fetchLeaveHistory()
  }, [fetchLeaveHistory])

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredRequests(requests)
    } else {
      setFilteredRequests(requests.filter(request => request.status === statusFilter))
    }
  }, [statusFilter, requests])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

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

  const getStatusCounts = () => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length
    }
  }

  const statusCounts = getStatusCounts()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Team Leave History
          </CardTitle>
          <CardDescription>Complete leave request history for your team</CardDescription>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Team Leave History
        </CardTitle>
        <CardDescription>Complete leave request history for your team</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter Controls */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filter by status:</span>
          </div>
          <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({statusCounts.all})</SelectItem>
              <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
              <SelectItem value="approved">Approved ({statusCounts.approved})</SelectItem>
              <SelectItem value="rejected">Rejected ({statusCounts.rejected})</SelectItem>
              <SelectItem value="cancelled">Cancelled ({statusCounts.cancelled})</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeaveHistory}
            className="ml-auto"
          >
            Refresh
          </Button>
        </div>

        {/* Leave History List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {statusFilter === 'all' 
                ? 'No leave requests found' 
                : `No ${statusFilter} leave requests found`
              }
            </p>
            <p className="text-sm text-gray-400">
              {statusFilter === 'all' 
                ? 'Team leave requests will appear here' 
                : 'Try selecting a different status filter'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-gray-500" />
                        <h4 className="font-medium text-gray-900">{request.employee_name}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{request.leave_type_name}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(request.start_date)} - {formatDate(request.end_date)}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">Duration:</span> {request.total_days} day{request.total_days !== 1 ? 's' : ''}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Applied:</span> {formatDateTime(request.applied_at)}
                    </p>
                  </div>
                  <div>
                    {request.reviewed_at && (
                      <p className="text-gray-600">
                        <span className="font-medium">Reviewed:</span> {formatDateTime(request.reviewed_at)}
                      </p>
                    )}
                    {request.manager_comment && (
                      <p className="text-gray-600">
                        <span className="font-medium">Your Comment:</span> {request.manager_comment}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Reason:</span> {request.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
