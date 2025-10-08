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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
export type UserRole = Database['public']['Enums']['user_role']
