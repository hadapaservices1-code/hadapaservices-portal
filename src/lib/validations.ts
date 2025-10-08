import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["employee", "manager"], {
    message: "Please select a role",
  }),
  department: z.string().optional(),
  position: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  priority: z.enum(["low", "medium", "high"], {
    message: "Please select a priority level",
  }),
  status: z.enum(["planning", "in_progress", "completed", "on_hold"], {
    message: "Please select a status",
  }),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"],
})

export const teamMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["employee", "manager"], {
    message: "Please select a role",
  }),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
})

export const meetingSchema = z.object({
  title: z.string().min(2, "Meeting title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  duration: z.number().min(15, "Duration must be at least 15 minutes").max(480, "Duration cannot exceed 8 hours"),
  attendees: z.array(z.string()).min(1, "At least one attendee is required"),
})

export const timeTrackingSchema = z.object({
  notes: z.string().optional(),
})

export const clockInSchema = z.object({
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
})

export const clockOutSchema = z.object({
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
})

export const timesheetEntrySchema = z.object({
  project_id: z.string().uuid("Please select a valid project"),
  date: z.string().min(1, "Date is required"),
  hours_worked: z.number()
    .min(0.25, "Minimum 15 minutes (0.25 hours)")
    .max(24, "Cannot exceed 24 hours per day"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters"),
  task_category: z.enum(["development", "testing", "meeting", "documentation", "design", "review", "other"], {
    message: "Please select a task category",
  }),
  billable: z.boolean().default(true),
})

export const timesheetSubmissionSchema = z.object({
  week_start_date: z.string().min(1, "Week start date is required"),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
})

export const timesheetApprovalSchema = z.object({
  submission_id: z.string().uuid("Invalid submission ID"),
  action: z.enum(["approve", "reject"], {
    message: "Please select an action",
  }),
  rejection_reason: z.string().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type ProjectFormData = z.infer<typeof projectSchema>
export type TeamMemberFormData = z.infer<typeof teamMemberSchema>
export type MeetingFormData = z.infer<typeof meetingSchema>
export type TimeTrackingFormData = z.infer<typeof timeTrackingSchema>
export type ClockInFormData = z.infer<typeof clockInSchema>
export type ClockOutFormData = z.infer<typeof clockOutSchema>
export type TimesheetEntryFormData = z.infer<typeof timesheetEntrySchema>
export type TimesheetSubmissionFormData = z.infer<typeof timesheetSubmissionSchema>
export type TimesheetApprovalFormData = z.infer<typeof timesheetApprovalSchema>
