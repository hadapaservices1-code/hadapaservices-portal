"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, Send, CheckCircle2, Clock } from "lucide-react"
import { submitTimesheet } from "@/lib/timesheet"
import { timesheetSubmissionSchema, type TimesheetSubmissionFormData } from "@/lib/validations"

interface TimesheetSubmissionModalProps {
  userId: string
  totalHours: number
  entriesCount: number
  onSubmitted: () => void
  onClose: () => void
}

export function TimesheetSubmissionModal({ 
  userId, 
  totalHours, 
  entriesCount, 
  onSubmitted, 
  onClose 
}: TimesheetSubmissionModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TimesheetSubmissionFormData>({
    resolver: zodResolver(timesheetSubmissionSchema),
    defaultValues: {
      week_start_date: getCurrentWeekStart(),
    },
  })

  function getCurrentWeekStart(): string {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    return startOfWeek.toISOString().split('T')[0]
  }

  function getCurrentWeekEnd(): string {
    const today = new Date()
    const endOfWeek = new Date(today)
    endOfWeek.setDate(today.getDate() - today.getDay() + 6)
    return endOfWeek.toISOString().split('T')[0]
  }

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    return `${wholeHours}h ${minutes}m`
  }

  const onSubmit = async (data: TimesheetSubmissionFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await submitTimesheet(
        userId,
        data.week_start_date,
        data.notes
      )

      if (result.success) {
        reset()
        onSubmitted()
        onClose()
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      reset()
      setError(null)
      onClose()
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <Send className="h-5 w-5" />
          <span>Submit Timesheet</span>
        </DialogTitle>
        <DialogDescription>
          Submit your timesheet for manager approval
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* Week Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Week Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-600">Week Period</p>
              <p className="font-medium text-blue-900">
                {new Date(getCurrentWeekStart()).toLocaleDateString()} - {new Date(getCurrentWeekEnd()).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-blue-600">Total Hours</p>
              <p className="font-medium text-blue-900">{formatHours(totalHours)}</p>
            </div>
            <div>
              <p className="text-blue-600">Entries</p>
              <p className="font-medium text-blue-900">{entriesCount}</p>
            </div>
            <div>
              <p className="text-blue-600">Status</p>
              <p className="font-medium text-blue-900">Ready to Submit</p>
            </div>
          </div>
        </div>

        {/* Submission Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional notes for your manager..."
            rows={3}
            {...register("notes")}
            disabled={isLoading}
          />
          {errors.notes && (
            <p className="text-sm text-red-600">{errors.notes.message}</p>
          )}
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Important Notice</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Once submitted, you cannot edit your timesheet entries</li>
                <li>• Your manager will review and approve your timesheet</li>
                <li>• You will be notified once your timesheet is approved or rejected</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Submit Timesheet
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
