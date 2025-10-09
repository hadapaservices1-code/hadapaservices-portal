"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Clock, Play, Square, Timer, CheckCircle2, AlertCircle } from "lucide-react"
import { getCurrentTimeStatus, clockIn, clockOut, getWeeklyHours } from "@/lib/time-tracking"
import { ClockInFormData, ClockOutFormData, clockInSchema, clockOutSchema } from "@/lib/validations"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

interface TimeTrackingCardProps {
  userId: string
  userName: string
}

export function TimeTrackingCard({ userId, userName: _userName }: TimeTrackingCardProps) {
  const [timeStatus, setTimeStatus] = useState<{
    is_clocked_in: boolean
    current_time_in: string | null
    today_total_hours: number
    status: string
  } | null>(null)
  const [weeklyHours, setWeeklyHours] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isClockInOpen, setIsClockInOpen] = useState(false)
  const [isClockOutOpen, setIsClockOutOpen] = useState(false)

  const clockInForm = useForm<ClockInFormData>({
    resolver: zodResolver(clockInSchema),
  })

  const clockOutForm = useForm<ClockOutFormData>({
    resolver: zodResolver(clockOutSchema),
  })

  // Fetch time status and weekly hours
  const fetchTimeData = useCallback(async () => {
    try {
      const [status, weekly] = await Promise.all([
        getCurrentTimeStatus(userId),
        getWeeklyHours(userId)
      ])
      setTimeStatus(status)
      setWeeklyHours(weekly)
    } catch (error) {
      console.error('Error fetching time data:', error)
    }
  }, [userId])

  useEffect(() => {
    fetchTimeData()
    // Refresh every minute
    const interval = setInterval(fetchTimeData, 60000)
    return () => clearInterval(interval)
  }, [userId, fetchTimeData])

  const handleClockIn = async (data: ClockInFormData) => {
    setIsLoading(true)
    try {
      const result = await clockIn(userId, data.notes)
      if (result.success) {
        await fetchTimeData()
        setIsClockInOpen(false)
        clockInForm.reset()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error clocking in:', error)
      alert('Failed to clock in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClockOut = async (data: ClockOutFormData) => {
    setIsLoading(true)
    try {
      const result = await clockOut(userId, data.notes)
      if (result.success) {
        await fetchTimeData()
        setIsClockOutOpen(false)
        clockOutForm.reset()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error clocking out:', error)
      alert('Failed to clock out. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'N/A'
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const [lastUpdated, setLastUpdated] = useState<string>('')

  // Update last updated time on client side only
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setLastUpdated(now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [timeStatus])

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    return `${wholeHours}h ${minutes}m`
  }

  const getCurrentDuration = () => {
    if (!timeStatus?.is_clocked_in || !timeStatus.current_time_in) return '0h 0m'
    const now = new Date()
    const clockInTime = new Date(timeStatus.current_time_in)
    const diffMs = now.getTime() - clockInTime.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return formatDuration(diffHours)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Time Tracking</span>
        </CardTitle>
        <CardDescription>
          Track your daily work hours and manage your time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {timeStatus?.is_clocked_in ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Clocked In</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-gray-500">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Clocked Out</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Session</p>
              <p className="text-lg font-semibold">
                {timeStatus?.is_clocked_in ? getCurrentDuration() : '0h 0m'}
              </p>
            </div>
          </div>

          {timeStatus?.is_clocked_in && timeStatus.current_time_in && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-700">
                Clocked in at {formatTime(timeStatus.current_time_in)}
              </p>
            </div>
          )}
        </div>

        {/* Today's Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Today&apos;s Hours</p>
            <p className="text-2xl font-bold text-blue-900">
              {formatDuration(timeStatus?.today_total_hours || 0)}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">This Week</p>
            <p className="text-2xl font-bold text-purple-900">
              {formatDuration(weeklyHours)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {!timeStatus?.is_clocked_in ? (
            <Dialog open={isClockInOpen} onOpenChange={setIsClockInOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Clock In
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clock In</DialogTitle>
                  <DialogDescription>
                    Start your work day. You can add optional notes about your tasks.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={clockInForm.handleSubmit(handleClockIn)} className="space-y-4">
                  <div>
                    <Label htmlFor="clock-in-notes">Notes (Optional)</Label>
                    <Textarea
                      id="clock-in-notes"
                      placeholder="What are you working on today?"
                      {...clockInForm.register('notes')}
                    />
                    {clockInForm.formState.errors.notes && (
                      <p className="text-sm text-red-600 mt-1">
                        {clockInForm.formState.errors.notes.message}
                      </p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsClockInOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Clocking In...' : 'Clock In'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={isClockOutOpen} onOpenChange={setIsClockOutOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex-1" size="lg">
                  <Square className="h-4 w-4 mr-2" />
                  Clock Out
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clock Out</DialogTitle>
                  <DialogDescription>
                    End your work day. You can add notes about what you accomplished.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={clockOutForm.handleSubmit(handleClockOut)} className="space-y-4">
                  <div>
                    <Label htmlFor="clock-out-notes">Notes (Optional)</Label>
                    <Textarea
                      id="clock-out-notes"
                      placeholder="What did you accomplish today?"
                      {...clockOutForm.register('notes')}
                    />
                    {clockOutForm.formState.errors.notes && (
                      <p className="text-sm text-red-600 mt-1">
                        {clockOutForm.formState.errors.notes.message}
                      </p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsClockOutOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="destructive" disabled={isLoading}>
                      {isLoading ? 'Clocking Out...' : 'Clock Out'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Quick Stats */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Timer className="h-4 w-4" />
              <span>Last updated: {lastUpdated || 'Loading...'}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchTimeData}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
