'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, MessageSquare, MoreVertical, Eye, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  getEmployeeLeaveRequests, 
  cancelLeaveRequest, 
  type LeaveRequestWithDetails 
} from '@/lib/leave'
import { toast } from 'sonner'
import { LeaveRequestDetailsModal } from './leave-request-details-modal'

interface LeaveRequestsListProps {
  employeeId: string
  onRefresh?: () => void
}

export function LeaveRequestsList({ employeeId, onRefresh }: LeaveRequestsListProps) {
  const [requests, setRequests] = useState<LeaveRequestWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestWithDetails | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getEmployeeLeaveRequests(employeeId)
      setRequests(data)
    } catch (error) {
      console.error('Error fetching leave requests:', error)
      toast.error('Failed to load leave requests')
    } finally {
      setIsLoading(false)
    }
  }, [employeeId])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleCancelRequest = async (requestId: string) => {
    try {
      const result = await cancelLeaveRequest(requestId)
      if (result.success) {
        toast.success('Leave request cancelled successfully')
        fetchRequests()
        onRefresh?.()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error cancelling leave request:', error)
      toast.error('Failed to cancel leave request')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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
      <Card>
        <CardHeader>
          <CardTitle>My Leave Requests</CardTitle>
          <CardDescription>Your submitted leave requests</CardDescription>
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Leave Requests</CardTitle>
              <CardDescription>Your submitted leave requests</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRequests}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No leave requests found</p>
              <p className="text-sm text-gray-400">Submit your first leave request to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">
                          {request.leave_type_name}
                        </h3>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(request.start_date)} - {formatDate(request.end_date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {request.total_days} {request.total_days === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {request.reason}
                      </p>
                      
                      {request.manager_comment && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <div className="flex items-center gap-1 text-blue-700 font-medium mb-1">
                            <MessageSquare className="h-4 w-4" />
                            Manager Comment
                          </div>
                          <p className="text-blue-800">{request.manager_comment}</p>
                        </div>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowDetails(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {request.status === 'pending' && (
                          <DropdownMenuItem
                            onClick={() => handleCancelRequest(request.id)}
                            className="text-red-600"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel Request
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRequest && (
        <LeaveRequestDetailsModal
          request={selectedRequest}
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false)
            setSelectedRequest(null)
          }}
          onRefresh={fetchRequests}
        />
      )}
    </>
  )
}
