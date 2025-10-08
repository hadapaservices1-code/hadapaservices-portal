"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase-client"
import { meetingSchema, type MeetingFormData } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Plus, Calendar } from "lucide-react"

interface ScheduleMeetingModalProps {
  onMeetingScheduled?: () => void
}

export function ScheduleMeetingModal({ onMeetingScheduled }: ScheduleMeetingModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attendees, setAttendees] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      attendees: [],
    },
  })

  const addAttendee = () => {
    const newAttendee = prompt("Enter attendee email:")
    if (newAttendee && newAttendee.trim()) {
      const updatedAttendees = [...attendees, newAttendee.trim()]
      setAttendees(updatedAttendees)
      setValue("attendees", updatedAttendees)
    }
  }

  const removeAttendee = (index: number) => {
    const updatedAttendees = attendees.filter((_, i) => i !== index)
    setAttendees(updatedAttendees)
    setValue("attendees", updatedAttendees)
  }

  const onSubmit = async (data: MeetingFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("You must be logged in to schedule meetings")
        return
      }

      // Create meeting in database
      const { data: meeting, error: meetingError } = await supabase
        .from("meetings")
        .insert({
          title: data.title,
          description: data.description,
          meeting_date: data.date,
          meeting_time: data.time,
          duration_minutes: data.duration,
          attendees: data.attendees,
          created_by: user.id,
          status: "scheduled",
        })
        .select()
        .single()

      if (meetingError) {
        console.error("Meeting creation error:", meetingError)
        setError("Failed to schedule meeting. Please try again.")
        return
      }

      console.log("Meeting scheduled successfully:", meeting)
      
      // Reset form and close modal
      reset()
      setAttendees([])
      setIsOpen(false)
      
      // Notify parent component
      if (onMeetingScheduled) {
        onMeetingScheduled()
      }
    } catch (err) {
      console.error("Meeting scheduling error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      reset()
      setAttendees([])
      setError(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
          <Calendar className="h-6 w-6" />
          <span>Schedule Meeting</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Schedule Meeting</span>
          </DialogTitle>
          <DialogDescription>
            Schedule a new meeting with your team members.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              placeholder="Enter meeting title"
              {...register("title")}
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter meeting description"
              rows={3}
              {...register("description")}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                {...register("date")}
                disabled={isLoading}
              />
              {errors.date && (
                <p className="text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                {...register("time")}
                disabled={isLoading}
              />
              {errors.time && (
                <p className="text-sm text-red-600">{errors.time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="480"
                placeholder="60"
                {...register("duration", { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.duration && (
                <p className="text-sm text-red-600">{errors.duration.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Attendees</Label>
            <div className="space-y-2">
              {attendees.map((attendee, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{attendee}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttendee(index)}
                    disabled={isLoading}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addAttendee}
                disabled={isLoading}
                className="w-full"
              >
                Add Attendee
              </Button>
            </div>
            {errors.attendees && (
              <p className="text-sm text-red-600">{errors.attendees.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule Meeting
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
