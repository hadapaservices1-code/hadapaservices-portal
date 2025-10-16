'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, Clock, FileText, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { leaveRequestSchema, type LeaveRequestFormData } from '@/lib/validations'
import { getLeaveTypes, type LeaveType } from '@/lib/leave'
import { toast } from 'sonner'
import { SuccessToasts } from '@/components/ui/success-toast'

interface LeaveRequestFormProps {
  employeeId: string
  onSuccess?: () => void
}

export function LeaveRequestForm({ employeeId, onSuccess }: LeaveRequestFormProps) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema)
  })

  const startDate = watch('startDate')
  const endDate = watch('endDate')

  // Calculate total days
  const totalDays = startDate && endDate ? 
    Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)) + 1 : 0

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const types = await getLeaveTypes()
        setLeaveTypes(types)
      } catch (error) {
        console.error('Error fetching leave types:', error)
        toast.error('Failed to load leave types')
      }
    }

    fetchLeaveTypes()
  }, [])

  const onSubmit = async (data: LeaveRequestFormData) => {
    setIsLoading(true)
    try {
      console.log('Submitting leave request with data:', {
        employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason
      })

      // Use API route instead of direct client-side function
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          leaveTypeId: data.leaveTypeId,
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason
        })
      })

      console.log('API response status:', response.status)
      console.log('API response headers:', response.headers)

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API response not ok:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Leave request result:', result)

      if (result.success) {
        SuccessToasts.leaveSubmitted()
        reset()
        setSelectedLeaveType(null)
        onSuccess?.()
      } else {
        console.error('Leave request failed:', result.message)
        toast.error(result.message || 'Failed to submit leave request')
      }
    } catch (error) {
      console.error('Error submitting leave request:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        errorName: error instanceof Error ? error.name : undefined,
        employeeId,
        formData: data
      })
      
      // Provide more specific error messages based on error type
      let errorMessage = 'An unexpected error occurred. Please try again.'
      if (error instanceof Error) {
        if (error.message.includes('API request failed')) {
          errorMessage = 'Server error. Please try again later.'
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeaveTypeChange = (leaveTypeId: string) => {
    setValue('leaveTypeId', leaveTypeId)
    const leaveType = leaveTypes.find(lt => lt.id === leaveTypeId)
    setSelectedLeaveType(leaveType || null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Request Leave
        </CardTitle>
        <CardDescription>
          Submit a new leave request for manager approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Leave Type */}
          <div className="space-y-2">
            <Label htmlFor="leaveTypeId">Leave Type *</Label>
            <Select onValueChange={handleLeaveTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((leaveType) => (
                  <SelectItem key={leaveType.id} value={leaveType.id}>
                    <div className="flex flex-col">
                      <span>{leaveType.name}</span>
                      {leaveType.max_days_per_year > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Max {leaveType.max_days_per_year} days/year
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.leaveTypeId && (
              <p className="text-sm text-red-500">{errors.leaveTypeId.message}</p>
            )}
            {selectedLeaveType && selectedLeaveType.description && (
              <p className="text-sm text-muted-foreground">
                {selectedLeaveType.description}
              </p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  className="pl-10"
                  {...register('startDate')}
                />
              </div>
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  className="pl-10"
                  {...register('endDate')}
                />
              </div>
              {errors.endDate && (
                <p className="text-sm text-red-500">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Total Days Display */}
          {totalDays > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Total Days: {totalDays} {totalDays === 1 ? 'day' : 'days'}
              </span>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed reason for your leave request..."
              className="min-h-[100px]"
              {...register('reason')}
            />
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Leave Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
