"use client"

import { useState } from "react"
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
import { Loader2, Save } from "lucide-react"
import { createTimesheetEntry, type Project } from "@/lib/timesheet"
import { timesheetEntrySchema, type TimesheetEntryFormData } from "@/lib/validations"

interface TimesheetEntryModalProps {
  userId: string
  availableProjects: Project[]
  onEntryAdded: () => void
  onClose: () => void
}

export function TimesheetEntryModal({ 
  userId, 
  availableProjects, 
  onEntryAdded, 
  onClose 
}: TimesheetEntryModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TimesheetEntryFormData>({
    resolver: zodResolver(timesheetEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      hours_worked: 1,
      billable: true,
    },
  })

  const billable = watch('billable')

  const onSubmit = async (data: TimesheetEntryFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createTimesheetEntry(userId, {
        project_id: data.project_id,
        date: data.date,
        hours_worked: data.hours_worked,
        description: data.description,
        task_category: data.task_category,
        billable: data.billable,
      })

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
            <Label htmlFor="project_id">Project</Label>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="task_category">Task Category</Label>
            <Select onValueChange={(value) => setValue("task_category", value as "development" | "testing" | "documentation" | "meeting" | "other")}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.task_category && (
              <p className="text-sm text-red-600">{errors.task_category.message}</p>
            )}
          </div>
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

        <div className="flex items-center space-x-2">
          <Switch
            id="billable"
            checked={billable}
            onCheckedChange={(checked) => setValue("billable", checked)}
            disabled={isLoading}
          />
          <Label htmlFor="billable">Billable time</Label>
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
            Add Entry
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
