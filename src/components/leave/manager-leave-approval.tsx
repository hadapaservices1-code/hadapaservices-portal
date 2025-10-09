'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, User, Check, X, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  getManagerPendingRequests, 
  getManagerPendingRequestsServer,
  updateLeaveRequestStatus, 
  type LeaveRequestWithDetails 
} from '@/lib/leave'
import { toast } from 'sonner'
import { LeaveRequestDetailsModal } from './leave-request-details-modal'

interface ManagerLeaveApprovalProps {
  managerId: string
  onRefresh?: () => void
}

export function ManagerLeaveApproval({ managerId, onRefresh }: ManagerLeaveApprovalProps) {
  const [requests, setRequests] = useState<LeaveRequestWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestWithDetails | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const [approvalComment, setApprovalComment] = useState('')

  const fetchRequests = useCallback(async () => {
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
      setRequests(data)
    } catch (error) {
      console.error('Error fetching pending requests:', error)
      toast.error('Failed to load pending requests')
    } finally {
      setIsLoading(false)
    }
  }, [managerId])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequest(requestId)
    try {
      const result = await updateLeaveRequestStatus(
        requestId,
        'approved',
        approvalComment || undefined
      )

      if (result.success) {
        toast.success('Leave request approved successfully')
        setApprovalComment('')
        fetchRequests()
        onRefresh?.()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error approving request:', error)
      toast.error('Failed to approve request')
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    if (!approvalComment.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setProcessingRequest(requestId)
    try {
      const result = await updateLeaveRequestStatus(
        requestId,
        'rejected',
        approvalComment
      )

      if (result.success) {
        toast.success('Leave request rejected')
        setApprovalComment('')
        fetchRequests()
        onRefresh?.()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast.error('Failed to reject request')
    } finally {
      setProcessingRequest(null)
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Requests</CardTitle>
          <CardDescription>Review and approve leave requests from your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg" />
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
          <CardTitle>Pending Leave Requests</CardTitle>
          <CardDescription>Review and approve leave requests from your team</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No pending leave requests</p>
              <p className="text-sm text-gray-400">All caught up! 🎉</p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium">{request.leave_type_name}</h3>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          Pending
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {request.employee_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(request.start_date)} - {formatDate(request.end_date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {request.total_days} {request.total_days === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                        {request.reason}
                      </p>

                      <div className="text-xs text-gray-500">
                        Applied on {formatDateTime(request.applied_at)}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Approval Actions */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`comment-${request.id}`}>Add Comment (Optional)</Label>
                      <Textarea
                        id={`comment-${request.id}`}
                        placeholder="Add a comment for the employee..."
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApproveRequest(request.id)}
                        disabled={processingRequest === request.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {processingRequest === request.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={processingRequest === request.id}
                        variant="destructive"
                        className="flex-1"
                      >
                        {processingRequest === request.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
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
