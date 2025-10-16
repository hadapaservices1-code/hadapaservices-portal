'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, MessageSquare, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  getLeaveRequestDetails, 
  addLeaveComment, 
  type LeaveRequestWithDetails, 
  type LeaveComment 
} from '@/lib/leave'
import { toast } from 'sonner'

interface LeaveRequestDetailsModalProps {
  request: LeaveRequestWithDetails
  isOpen: boolean
  onClose: () => void
  onRefresh?: () => void
}

export function LeaveRequestDetailsModal({ 
  request, 
  isOpen, 
  onClose, 
  onRefresh 
}: LeaveRequestDetailsModalProps) {
  const [comments, setComments] = useState<LeaveComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  const fetchDetails = useCallback(async () => {
    try {
      setIsLoading(true)
      const { request: details, comments: requestComments } = await getLeaveRequestDetails(request.id)
      if (details) {
        setComments(requestComments)
      }
    } catch (error) {
      console.error('Error fetching request details:', error)
      toast.error('Failed to load request details')
    } finally {
      setIsLoading(false)
    }
  }, [request.id])

  useEffect(() => {
    if (isOpen) {
      fetchDetails()
    }
  }, [isOpen, fetchDetails])

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      setIsSubmittingComment(true)
      const result = await addLeaveComment(
        request.id,
        request.employee_id, // This should be the current user's ID
        newComment.trim(),
        false
      )

      if (result.success) {
        toast.success('Comment added successfully')
        setNewComment('')
        fetchDetails()
        onRefresh?.()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setIsSubmittingComment(false)
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
      month: 'long',
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Leave Request Details
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{request.leave_type_name}</h3>
              <Badge className={getStatusColor(request.status)}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Employee</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{request.employee_name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Duration</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{request.total_days} {request.total_days === 1 ? 'day' : 'days'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Start Date</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(request.start_date)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">End Date</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(request.end_date)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Applied On</Label>
                <span className="text-sm">{formatDateTime(request.applied_at)}</span>
              </div>

              {request.reviewed_at && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Reviewed On</Label>
                  <span className="text-sm">{formatDateTime(request.reviewed_at)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Reason</Label>
              <p className="text-sm bg-gray-50 p-3 rounded-lg">{request.reason}</p>
            </div>

            {request.manager_comment && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Manager Comment</Label>
                <p className="text-sm bg-blue-50 p-3 rounded-lg text-blue-800">
                  {request.manager_comment}
                </p>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <h3 className="text-lg font-medium">Comments</h3>
            </div>

            {/* Add Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">Add Comment</Label>
              <div className="space-y-2">
                <Textarea
                  id="comment"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  size="sm"
                >
                  {isSubmittingComment ? 'Adding...' : 'Add Comment'}
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{(comment as { profiles?: { full_name?: string } }).profiles?.full_name || 'Unknown User'}</span>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
