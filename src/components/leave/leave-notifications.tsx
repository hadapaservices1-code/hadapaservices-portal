'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

interface LeaveNotification {
  id: string
  type: 'approved' | 'rejected' | 'pending' | 'cancelled'
  message: string
  timestamp: Date
  leaveRequestId?: string
  isRead: boolean
}

interface LeaveNotificationsProps {
  employeeId?: string
  managerId?: string
  onNotificationClick?: (leaveRequestId: string) => void
}

export function LeaveNotifications({ employeeId, managerId, onNotificationClick }: LeaveNotificationsProps) {
  const [notifications, setNotifications] = useState<LeaveNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (employeeId || managerId) {
      setupRealtimeSubscription()
      fetchInitialNotifications()
    }
  }, [employeeId, managerId])

  const fetchInitialNotifications = async () => {
    try {
      setIsLoading(true)
      // In a real implementation, you would fetch actual notifications from a notifications table
      // For now, we'll simulate some notifications
      const mockNotifications: LeaveNotification[] = []
      
      if (employeeId) {
        mockNotifications.push({
          id: '1',
          type: 'approved',
          message: 'Your Annual Leave request has been approved',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          isRead: false
        })
      }

      if (managerId) {
        mockNotifications.push({
          id: '2',
          type: 'pending',
          message: 'New leave request from John Doe',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          isRead: false
        })
      }

      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    // Set up real-time subscription for leave request changes
    const channel = supabase
      .channel('leave_notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leave_requests',
        filter: employeeId ? `employee_id=eq.${employeeId}` : `manager_id=eq.${managerId}`
      }, (payload) => {
        handleLeaveRequestChange(payload)
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const handleLeaveRequestChange = (payload: Record<string, unknown>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    if (eventType === 'INSERT' && newRecord) {
      // New leave request created
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (managerId && (newRecord as any).manager_id === managerId) {
        const record = newRecord as {
          id: string
          employee_name: string
          leave_type_name: string
          start_date: string
          end_date: string
        }
        
        const notification: LeaveNotification = {
          id: `new-${Date.now()}`,
          type: 'pending',
          message: `New leave request from ${record.employee_name}`,
          timestamp: new Date(),
          leaveRequestId: record.id,
          isRead: false
        }
        
        setNotifications(prev => [notification, ...prev])
        
        toast.success(`New leave request from ${record.employee_name}`, {
          description: `${record.leave_type_name} - ${record.start_date} to ${record.end_date}`,
          duration: 5000
        })
      }
    } else if (eventType === 'UPDATE' && newRecord && oldRecord) {
      // Leave request status changed
      const updateRecord = newRecord as {
        employee_id: string
        status: string
        id: string
      }
      
      if (employeeId && updateRecord.employee_id === employeeId) {
        const statusMessages = {
          approved: 'Your leave request has been approved! 🎉',
          rejected: 'Your leave request has been rejected',
          cancelled: 'Your leave request has been cancelled'
        }

        const message = statusMessages[updateRecord.status as keyof typeof statusMessages]
        if (message) {
          const notification: LeaveNotification = {
            id: `update-${Date.now()}`,
            type: updateRecord.status as 'approved' | 'rejected' | 'cancelled',
            message,
            timestamp: new Date(),
            leaveRequestId: updateRecord.id,
            isRead: false
          }
          
          setNotifications(prev => [notification, ...prev])
          
          const toastRecord = newRecord as {
            leave_type_name: string
            start_date: string
            end_date: string
          }
          
          toast.success(message, {
            description: `${toastRecord.leave_type_name} - ${toastRecord.start_date} to ${toastRecord.end_date}`,
            duration: 5000
          })
        }
      }
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    )
  }

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
  }

  const handleNotificationClick = (notification: LeaveNotification) => {
    markAsRead(notification.id)
    if (notification.leaveRequestId && onNotificationClick) {
      onNotificationClick(notification.leaveRequestId)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-gray-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'approved':
        return 'bg-green-50 border-green-200'
      case 'rejected':
        return 'bg-red-50 border-red-200'
      case 'pending':
        return 'bg-yellow-50 border-yellow-200'
      case 'cancelled':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-3 rounded-lg border bg-gray-50 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-gray-300 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-300 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-4">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No notifications</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-opacity-80 ${
            getNotificationColor(notification.type)
          } ${notification.isRead ? 'opacity-60' : ''}`}
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="flex items-start gap-3">
            {getNotificationIcon(notification.type)}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {notification.timestamp.toLocaleString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                removeNotification(notification.id)
              }}
              className="h-6 w-6 p-0 hover:bg-gray-200"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

// Hook for managing leave notifications
export function useLeaveNotifications(employeeId?: string, managerId?: string) {
  const [hasNewNotifications, setHasNewNotifications] = useState(false)

  useEffect(() => {
    // This would typically check for unread notifications
    // For now, we'll simulate it
    setHasNewNotifications(false)
  }, [employeeId, managerId])

  return {
    hasNewNotifications,
    markAsRead: () => setHasNewNotifications(false)
  }
}
