export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'employee' | 'manager' | 'admin'
          department: string | null
          position: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          manager_id: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'employee' | 'manager' | 'admin'
          department?: string | null
          position?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          manager_id?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'employee' | 'manager' | 'admin'
          department?: string | null
          position?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          manager_id?: string | null
        }
      }
      departments: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      time_tracking: {
        Row: {
          id: string
          user_id: string
          date: string
          time_in: string | null
          time_out: string | null
          total_hours: number
          break_duration_minutes: number
          notes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          time_in?: string | null
          time_out?: string | null
          total_hours?: number
          break_duration_minutes?: number
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          time_in?: string | null
          time_out?: string | null
          total_hours?: number
          break_duration_minutes?: number
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      timesheet_entries: {
        Row: {
          id: string
          user_id: string
          project_id: string
          date: string
          hours_worked: number
          description: string
          task_category: string | null
          billable: boolean
          status: string
          approved_by: string | null
          approved_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          date: string
          hours_worked: number
          description: string
          task_category?: string | null
          billable?: boolean
          status?: string
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          date?: string
          hours_worked?: number
          description?: string
          task_category?: string | null
          billable?: boolean
          status?: string
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      timesheet_submissions: {
        Row: {
          id: string
          user_id: string
          week_start_date: string
          week_end_date: string
          total_hours: number
          status: string
          submitted_at: string | null
          approved_by: string | null
          approved_at: string | null
          rejection_reason: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start_date: string
          week_end_date: string
          total_hours?: number
          status?: string
          submitted_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start_date?: string
          week_end_date?: string
          total_hours?: number
          status?: string
          submitted_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to: string
          assigned_by: string
          project_id: string | null
          due_date: string | null
          completed_at: string | null
          estimated_hours: number | null
          actual_hours: number
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to: string
          assigned_by: string
          project_id?: string | null
          due_date?: string | null
          completed_at?: string | null
          estimated_hours?: number | null
          actual_hours?: number
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string
          assigned_by?: string
          project_id?: string | null
          due_date?: string | null
          completed_at?: string | null
          estimated_hours?: number | null
          actual_hours?: number
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      task_comments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          comment: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          comment: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          comment?: string
          created_at?: string
          updated_at?: string
        }
      }
      task_attachments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          file_name: string
          file_url: string
          file_size: number | null
          file_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          file_name: string
          file_url: string
          file_size?: number | null
          file_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          file_name?: string
          file_url?: string
          file_size?: number | null
          file_type?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    leave_types: {
      Row: {
        id: string
        name: string
        description: string | null
        max_days_per_year: number
        requires_approval: boolean
        is_active: boolean
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        name: string
        description?: string | null
        max_days_per_year?: number
        requires_approval?: boolean
        is_active?: boolean
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        name?: string
        description?: string | null
        max_days_per_year?: number
        requires_approval?: boolean
        is_active?: boolean
        created_at?: string
        updated_at?: string
      }
    }
    leave_requests: {
      Row: {
        id: string
        employee_id: string
        manager_id: string | null
        leave_type_id: string
        start_date: string
        end_date: string
        total_days: number
        reason: string
        status: 'pending' | 'approved' | 'rejected' | 'cancelled'
        manager_comment: string | null
        applied_at: string
        reviewed_at: string | null
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        employee_id: string
        manager_id?: string | null
        leave_type_id: string
        start_date: string
        end_date: string
        total_days: number
        reason: string
        status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
        manager_comment?: string | null
        applied_at?: string
        reviewed_at?: string | null
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        employee_id?: string
        manager_id?: string | null
        leave_type_id?: string
        start_date?: string
        end_date?: string
        total_days?: number
        reason?: string
        status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
        manager_comment?: string | null
        applied_at?: string
        reviewed_at?: string | null
        created_at?: string
        updated_at?: string
      }
    }
    leave_balances: {
      Row: {
        id: string
        employee_id: string
        leave_type_id: string
        year: number
        total_days: number
        used_days: number
        remaining_days: number
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        employee_id: string
        leave_type_id: string
        year: number
        total_days?: number
        used_days?: number
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        employee_id?: string
        leave_type_id?: string
        year?: number
        total_days?: number
        used_days?: number
        created_at?: string
        updated_at?: string
      }
    }
    leave_comments: {
      Row: {
        id: string
        leave_request_id: string
        user_id: string
        comment: string
        is_internal: boolean
        created_at: string
      }
      Insert: {
        id?: string
        leave_request_id: string
        user_id: string
        comment: string
        is_internal?: boolean
        created_at?: string
      }
      Update: {
        id?: string
        leave_request_id?: string
        user_id?: string
        comment?: string
        is_internal?: boolean
        created_at?: string
      }
    }
    expense_categories: {
      Row: {
        id: string
        name: string
        description: string | null
        max_amount: number | null
        requires_receipt: boolean
        is_active: boolean
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        name: string
        description?: string | null
        max_amount?: number | null
        requires_receipt?: boolean
        is_active?: boolean
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        name?: string
        description?: string | null
        max_amount?: number | null
        requires_receipt?: boolean
        is_active?: boolean
        created_at?: string
        updated_at?: string
      }
    }
    expenses: {
      Row: {
        id: string
        employee_id: string
        manager_id: string | null
        category_id: string
        title: string
        description: string
        amount: number
        currency: string
        expense_date: string
        receipt_url: string | null
        status: 'pending' | 'approved' | 'rejected' | 'cancelled'
        manager_comment: string | null
        submitted_at: string
        reviewed_at: string | null
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        employee_id: string
        manager_id?: string | null
        category_id: string
        title: string
        description: string
        amount: number
        currency?: string
        expense_date: string
        receipt_url?: string | null
        status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
        manager_comment?: string | null
        submitted_at?: string
        reviewed_at?: string | null
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        employee_id?: string
        manager_id?: string | null
        category_id?: string
        title?: string
        description?: string
        amount?: number
        currency?: string
        expense_date?: string
        receipt_url?: string | null
        status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
        manager_comment?: string | null
        submitted_at?: string
        reviewed_at?: string | null
        created_at?: string
        updated_at?: string
      }
    }
    expense_comments: {
      Row: {
        id: string
        expense_id: string
        user_id: string
        comment: string
        is_internal: boolean
        created_at: string
      }
      Insert: {
        id?: string
        expense_id: string
        user_id: string
        comment: string
        is_internal?: boolean
        created_at?: string
      }
      Update: {
        id?: string
        expense_id?: string
        user_id?: string
        comment?: string
        is_internal?: boolean
        created_at?: string
      }
    }
    Enums: {
      user_role: 'employee' | 'manager' | 'admin'
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Department = Database['public']['Tables']['departments']['Row']
export type TimeTracking = Database['public']['Tables']['time_tracking']['Row']
export type TimesheetEntry = Database['public']['Tables']['timesheet_entries']['Row']
export type TimesheetSubmission = Database['public']['Tables']['timesheet_submissions']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskComment = Database['public']['Tables']['task_comments']['Row']
export type TaskAttachment = Database['public']['Tables']['task_attachments']['Row']
// Temporary interfaces until database types are updated
export interface LeaveType {
  id: string
  name: string
  description: string
  max_days_per_year: number
  requires_approval: boolean
  created_at: string
  updated_at: string
}

// Temporary interfaces until database types are updated
export interface LeaveRequest {
  id: string
  employee_id: string
  manager_id: string | null
  leave_type_id: string
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  manager_comment: string | null
  applied_at: string
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface LeaveBalance {
  id: string
  employee_id: string
  leave_type_id: string
  total_days: number
  used_days: number
  remaining_days: number
  year: number
  created_at: string
  updated_at: string
}

export interface LeaveComment {
  id: string
  leave_request_id: string
  user_id: string
  comment: string
  created_at: string
  updated_at: string
}
export type UserRole = Database['public']['Enums']['user_role']

// Expense Management Types
// Temporarily comment out until database types are properly generated
// export type ExpenseCategory = Database['public']['Tables']['expense_categories']['Row']
// export type Expense = Database['public']['Tables']['expenses']['Row']
// export type ExpenseComment = Database['public']['Tables']['expense_comments']['Row']

// Temporary type definitions
export interface ExpenseCategory {
  id: string
  name: string
  description: string | null
  max_amount: number | null
  requires_receipt: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  employee_id: string
  manager_id: string | null
  category_id: string
  title: string
  description: string
  amount: number
  currency: string
  expense_date: string
  receipt_url: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  manager_comment: string | null
  submitted_at: string
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface ExpenseComment {
  id: string
  expense_id: string
  user_id: string
  comment: string
  is_internal: boolean
  created_at: string
}
