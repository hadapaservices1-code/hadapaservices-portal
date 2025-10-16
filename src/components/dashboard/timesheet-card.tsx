"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Clock, Plus, FileText, CheckCircle2, AlertCircle, Calendar, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase-client"
import { 
  getCurrentWeekTimesheet, 
  getCurrentWeekTotalHours, 
  hasSubmittedCurrentWeek,
  getAvailableProjects,
  type Project,
  type TimesheetEntry
} from "@/lib/timesheet"
import { TimesheetEntryModal } from "./timesheet-entry-modal"
import { TimesheetSubmissionModal } from "./timesheet-submission-modal"

interface TimesheetCardProps {
  userId: string
  userName: string
}

export function TimesheetCard({ userId, userName: _userName }: TimesheetCardProps) {
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([])
  const [totalHours, setTotalHours] = useState<number>(0)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)
  const [availableProjects, setAvailableProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // Fetch timesheet data
  const fetchTimesheetData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [entries, hours, submitted, projects] = await Promise.all([
        getCurrentWeekTimesheet(userId),
        getCurrentWeekTotalHours(userId),
        hasSubmittedCurrentWeek(userId),
        getAvailableProjects(userId)
      ])
      
      setTimesheetEntries(entries)
      setTotalHours(hours)
      setHasSubmitted(submitted)
      setAvailableProjects(projects)
    } catch (error) {
      console.error('Error fetching timesheet data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchTimesheetData()
  }, [userId, fetchTimesheetData])

  // Set up real-time subscription for project changes
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const subscription = supabase
      .channel('timesheet-projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          console.log('Project change detected in timesheet card:', payload)
          // Refresh projects when any change occurs
          getAvailableProjects(userId).then(projects => {
            setAvailableProjects(projects)
          })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  // Update last updated time on client side only to avoid hydration mismatch
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
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    return `${wholeHours}h ${minutes}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTaskCategoryColor = (category: string) => {
    switch (category) {
      case 'development':
        return 'bg-blue-100 text-blue-800'
      case 'testing':
        return 'bg-yellow-100 text-yellow-800'
      case 'meeting':
        return 'bg-purple-100 text-purple-800'
      case 'documentation':
        return 'bg-green-100 text-green-800'
      case 'design':
        return 'bg-pink-100 text-pink-800'
      case 'review':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Timesheet</span>
          </div>
          <div className="flex items-center space-x-2">
            {hasSubmitted ? (
              <Badge className="bg-blue-100 text-blue-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Submitted
              </Badge>
            ) : (
              <Badge variant="outline">
                <AlertCircle className="h-3 w-3 mr-1" />
                Draft
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Track your time spent on different projects
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weekly Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">This Week</p>
            <p className="text-2xl font-bold text-blue-900">
              {formatHours(totalHours)}
            </p>
            <p className="text-xs text-blue-500">
              {timesheetEntries.length} entries
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <p className="text-sm text-green-600 font-medium">Available Projects</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchTimesheetData}
                disabled={isLoading}
                className="h-6 w-6 p-0 hover:bg-green-100"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {availableProjects.length}
            </p>
            <p className="text-xs text-green-500">
              {availableProjects.length > 0 ? 'Active projects' : 'No projects available'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Dialog open={isEntryModalOpen} onOpenChange={setIsEntryModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <TimesheetEntryModal
                userId={userId}
                availableProjects={availableProjects}
                onEntryAdded={() => {
                  fetchTimesheetData() // This will refresh projects too
                }}
                onClose={() => setIsEntryModalOpen(false)}
                isOpen={isEntryModalOpen}
              />
            </DialogContent>
          </Dialog>

          {!hasSubmitted && timesheetEntries.length > 0 && (
            <Dialog open={isSubmissionModalOpen} onOpenChange={setIsSubmissionModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1" size="lg">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Submit Week
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <TimesheetSubmissionModal
                  userId={userId}
                  totalHours={totalHours}
                  entriesCount={timesheetEntries.length}
                  onSubmitted={fetchTimesheetData}
                  onClose={() => setIsSubmissionModalOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Recent Entries */}
        {timesheetEntries.length > 0 ? (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>This Week&apos;s Entries</span>
            </h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {timesheetEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="font-medium text-gray-900">
                        {((entry as Record<string, unknown>).projects as { name?: string })?.name || 'Unknown Project'}
                      </h5>
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{entry.description}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(entry.date)}
                      </span>
                      {entry.task_category && (
                        <Badge className={getTaskCategoryColor(entry.task_category)}>
                          {entry.task_category}
                        </Badge>
                      )}
                      {!entry.billable && (
                        <Badge variant="outline" className="text-xs">
                          Non-billable
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatHours(entry.hours_worked)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No timesheet entries yet</p>
            <p className="text-sm">
              Start tracking your time by adding your first entry
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Last updated: {lastUpdated || 'Loading...'}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchTimesheetData}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
