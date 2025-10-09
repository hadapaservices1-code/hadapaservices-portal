"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Plus } from "lucide-react"
import { createTask, getAvailableProjects, type Project } from "@/lib/tasks"
import { z } from "zod"

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  priority: z.enum(["low", "medium", "high", "urgent"], {
    message: "Please select a priority",
  }),
  assigned_to: z.string().min(1, "Please select an assignee"),
  project_id: z.string().optional(),
  due_date: z.string().optional(),
  estimated_hours: z.number().min(0.25, "Minimum 15 minutes").max(100, "Maximum 100 hours").optional(),
  tags: z.string().optional(),
})

type CreateTaskFormData = z.infer<typeof createTaskSchema>

interface CreateTaskModalProps {
  onTaskCreated: () => void
  onClose: () => void
}

export function CreateTaskModal({ onTaskCreated, onClose }: CreateTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableProjects, setAvailableProjects] = useState<Project[]>([])
  const [teamMembers, setTeamMembers] = useState<{id: string, name: string, email: string}[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      priority: "medium",
    },
  })

  // Fetch available projects and team members
  useEffect(() => {
    const fetchData = async () => {
      try {
        // For now, we'll use mock data for team members
        // In a real app, you'd fetch this from your API
        setTeamMembers([
          { id: "1", name: "John Doe", email: "john@example.com" },
          { id: "2", name: "Jane Smith", email: "jane@example.com" },
          { id: "3", name: "Mike Johnson", email: "mike@example.com" },
        ])
        
        // Fetch available projects
        const projects = await getAvailableProjects()
        setAvailableProjects(projects)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const onSubmit = async (data: CreateTaskFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Parse tags from comma-separated string
      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined

      const result = await createTask(
        {
          title: data.title,
          description: data.description,
          priority: data.priority,
          assigned_to: data.assigned_to,
          project_id: data.project_id,
          due_date: data.due_date,
          estimated_hours: data.estimated_hours,
          tags,
        },
        "current-user-id" // You'd get this from context
      )

      if (result.success) {
        reset()
        onTaskCreated()
        onClose()
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error('Error creating task:', error)
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
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Create New Task</span>
          </DialogTitle>
          <DialogDescription>
            Assign a new task to a team member
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              {...register("title")}
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              rows={3}
              {...register("description")}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select onValueChange={(value) => setValue("priority", value as "low" | "medium" | "high" | "urgent")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-sm text-red-600">{errors.priority.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assign To</Label>
              <Select onValueChange={(value) => setValue("assigned_to", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assigned_to && (
                <p className="text-sm text-red-600">{errors.assigned_to.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project_id">Project (Optional)</Label>
              <Select onValueChange={(value) => setValue("project_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No project</SelectItem>
                  {availableProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date (Optional)</Label>
              <Input
                id="due_date"
                type="date"
                {...register("due_date")}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Estimated Hours (Optional)</Label>
              <Input
                id="estimated_hours"
                type="number"
                step="0.25"
                min="0.25"
                max="100"
                placeholder="e.g., 2.5"
                {...register("estimated_hours", { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.estimated_hours && (
                <p className="text-sm text-red-600">{errors.estimated_hours.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <Input
                id="tags"
                placeholder="e.g., frontend, bug, feature"
                {...register("tags")}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">Separate multiple tags with commas</p>
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
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
