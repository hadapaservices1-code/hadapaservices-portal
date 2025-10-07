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
export type UserRole = Database['public']['Enums']['user_role']
