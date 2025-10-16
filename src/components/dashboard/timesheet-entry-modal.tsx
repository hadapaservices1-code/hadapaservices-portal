"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, Save, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { createTimesheetEntry, getAvailableProjects, type Project } from "@/lib/timesheet"
import { createClient } from "@/lib/supabase-client"
import { timesheetEntrySchema, type TimesheetEntryFormData } from "@/lib/validations"

interface TimesheetEntryModalProps {
  userId: string
  availableProjects: Project[]
  onEntryAdded: () => void
  onClose: () => void
  isOpen?: boolean
}

export function TimesheetEntryModal({ 
  userId, 
  availableProjects: initialProjects, 
  onEntryAdded, 
  onClose,
  isOpen = true
}: TimesheetEntryModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableProjects, setAvailableProjects] = useState<Project[]>(initialProjects)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [projectsRefreshed, setProjectsRefreshed] = useState(false)

  const refreshProjects = async () => {
    try {
      setIsLoadingProjects(true)
      const freshProjects = await getAvailableProjects(userId)
      setAvailableProjects(freshProjects)
      setProjectsRefreshed(true)
      
      // Hide success message after 3 seconds
      setTimeout(() => setProjectsRefreshed(false), 3000)
    } catch (error) {
      console.error('Error refreshing projects:', error)
    } finally {
      setIsLoadingProjects(false)
    }
  }

  // Fetch fresh projects when modal opens and set up real-time subscription
  useEffect(() => {
    if (!isOpen) return

    const fetchFreshProjects = async () => {
      try {
        setIsLoadingProjects(true)
        const freshProjects = await getAvailableProjects(userId)
        setAvailableProjects(freshProjects)
        setProjectsRefreshed(true)
        
        // Hide success message after 3 seconds
        setTimeout(() => setProjectsRefreshed(false), 3000)
      } catch (error) {
        console.error('Error fetching fresh projects:', error)
        // Keep the initial projects if fetching fails
      } finally {
        setIsLoadingProjects(false)
      }
    }

    // Add a small delay to ensure the modal is fully open
    const timeoutId = setTimeout(fetchFreshProjects, 100)
    
    // Set up real-time subscription for project changes
    const supabase = createClient()
    const subscription = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          console.log('Project change detected:', payload)
          // Refresh projects when any change occurs
          fetchFreshProjects()
        }
      )
      .subscribe()

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [userId, isOpen])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<TimesheetEntryFormData>({
    resolver: zodResolver(timesheetEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      hours_worked: 1,
    },
  })

  const onSubmit = async (data: TimesheetEntryFormData) => {
    setIsLoading(true)
    setError(null)

    console.log('Form submission started with data:', {
      userId,
      formData: data,
      timestamp: new Date().toISOString()
    })

    // Validate required fields
    if (!data.project_id) {
      setError('Please select a project')
      setIsLoading(false)
      return
    }

    if (!data.date) {
      setError('Please select a date')
      setIsLoading(false)
      return
    }

    if (!data.hours_worked || data.hours_worked <= 0) {
      setError('Please enter valid hours worked')
      setIsLoading(false)
      return
    }

    if (!data.description || data.description.trim().length < 10) {
      setError('Please enter a description with at least 10 characters')
      setIsLoading(false)
      return
    }

    try {
      const result = await createTimesheetEntry(userId, {
        project_id: data.project_id,
        date: data.date,
        hours_worked: data.hours_worked,
        description: data.description,
      })

      console.log('Timesheet entry result:', result)

      if (result.success) {
        reset()
        onEntryAdded()
        onClose()
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error('Error creating timesheet entry:', error)
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
          <Save className="h-5 w-5" />
          <span>Add Timesheet Entry</span>
        </DialogTitle>
        <DialogDescription>
          Log your time spent working on a specific project
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="project_id">Project</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={refreshProjects}
                disabled={isLoadingProjects}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingProjects ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {isLoadingProjects ? (
              <div className="p-3 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading latest projects...</span>
                </div>
              </div>
            ) : projectsRefreshed ? (
              <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Projects updated successfully!</span>
                </div>
              </div>
            ) : availableProjects.length === 0 ? (
              <div className="p-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>No projects available. Please contact your manager to assign you to a project.</span>
                </div>
              </div>
            ) : (
              <Select onValueChange={(value) => setValue("project_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {availableProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-xs text-gray-500">
                          {project.priority} priority
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.project_id && (
              <p className="text-sm text-red-600">{errors.project_id.message}</p>
            )}
          </div>

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
        </div>

        <div className="space-y-2">
          <Label htmlFor="hours_worked">Hours Worked</Label>
          <Input
            id="hours_worked"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            placeholder="e.g., 2.5"
            {...register("hours_worked", { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.hours_worked && (
            <p className="text-sm text-red-600">{errors.hours_worked.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Enter hours in decimal format (e.g., 2.5 for 2 hours 30 minutes)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe what you worked on..."
            rows={3}
            {...register("description")}
            disabled={isLoading}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
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
          <Button type="submit" disabled={isLoading || isLoadingProjects || availableProjects.length === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Entry
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
