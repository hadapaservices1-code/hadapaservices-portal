"use client"

import { createClient } from "@/lib/supabase-client"

export interface Project {
  id: string
  name: string
  description: string
  start_date: string
  end_date: string
  priority: 'low' | 'medium' | 'high'
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold'
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProjectResponse {
  success: boolean
  message: string
  data: Project | null
}

// Get all projects for a manager
export async function getManagerProjects(managerId: string): Promise<Project[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('created_by', managerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching manager projects:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getManagerProjects:', error)
    return []
  }
}

// Create a new project
export async function createProject(
  managerId: string,
  projectData: {
    name: string
    description: string
    start_date: string
    end_date: string
    priority: 'low' | 'medium' | 'high'
    status: 'planning' | 'in_progress' | 'completed' | 'on_hold'
  }
): Promise<ProjectResponse> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        created_by: managerId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return {
        success: false,
        message: error.message || 'Failed to create project',
        data: null
      }
    }

    return {
      success: true,
      message: 'Project created successfully',
      data
    }
  } catch (error) {
    console.error('Error in createProject:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: null
    }
  }
}

// Update a project
export async function updateProject(
  projectId: string,
  managerId: string,
  projectData: {
    name?: string
    description?: string
    start_date?: string
    end_date?: string
    priority?: 'low' | 'medium' | 'high'
    status?: 'planning' | 'in_progress' | 'completed' | 'on_hold'
  }
): Promise<ProjectResponse> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', projectId)
      .eq('created_by', managerId)
      .select()
      .single()

    if (error) {
      console.error('Error updating project:', error)
      return {
        success: false,
        message: error.message || 'Failed to update project',
        data: null
      }
    }

    return {
      success: true,
      message: 'Project updated successfully',
      data
    }
  } catch (error) {
    console.error('Error in updateProject:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: null
    }
  }
}

// Delete a project
export async function deleteProject(
  projectId: string,
  managerId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('created_by', managerId)

    if (error) {
      console.error('Error deleting project:', error)
      return {
        success: false,
        message: error.message || 'Failed to delete project'
      }
    }

    return {
      success: true,
      message: 'Project deleted successfully'
    }
  } catch (error) {
    console.error('Error in deleteProject:', error)
    return {
      success: false,
      message: 'An unexpected error occurred'
    }
  }
}

// Get project statistics for a manager
export async function getProjectStats(managerId: string): Promise<{
  total: number
  planning: number
  in_progress: number
  completed: number
  on_hold: number
  high_priority: number
  medium_priority: number
  low_priority: number
}> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .select('status, priority')
      .eq('created_by', managerId)

    if (error) {
      console.error('Error fetching project stats:', error)
      return {
        total: 0,
        planning: 0,
        in_progress: 0,
        completed: 0,
        on_hold: 0,
        high_priority: 0,
        medium_priority: 0,
        low_priority: 0
      }
    }

    const stats = {
      total: data.length,
      planning: data.filter(p => p.status === 'planning').length,
      in_progress: data.filter(p => p.status === 'in_progress').length,
      completed: data.filter(p => p.status === 'completed').length,
      on_hold: data.filter(p => p.status === 'on_hold').length,
      high_priority: data.filter(p => p.priority === 'high').length,
      medium_priority: data.filter(p => p.priority === 'medium').length,
      low_priority: data.filter(p => p.priority === 'low').length
    }

    return stats
  } catch (error) {
    console.error('Error in getProjectStats:', error)
    return {
      total: 0,
      planning: 0,
      in_progress: 0,
      completed: 0,
      on_hold: 0,
      high_priority: 0,
      medium_priority: 0,
      low_priority: 0
    }
  }
}

// Project employee assignment interface
export interface ProjectEmployee {
  user_id: string
  full_name: string
  email: string
  total_hours: number
  entries_count: number
  last_entry_date: string | null
}

// Get employees assigned to a project (from timesheet entries)
export async function getProjectEmployees(projectId: string): Promise<ProjectEmployee[]> {
  try {
    const supabase = createClient()
    
    // Get all unique user_ids that have timesheet entries for this project
    const { data: timesheetData, error } = await supabase
      .from('timesheet_entries')
      .select('user_id, hours_worked, date')
      .eq('project_id', projectId)

    if (error) {
      console.error('Error fetching project timesheet entries:', error)
      return []
    }

    if (!timesheetData || timesheetData.length === 0) {
      return []
    }

    // Get unique user IDs and calculate totals
    const userMap = new Map<string, {
      total_hours: number
      entries_count: number
      last_entry_date: string | null
    }>()

    timesheetData.forEach(entry => {
      if (!userMap.has(entry.user_id)) {
        userMap.set(entry.user_id, {
          total_hours: 0,
          entries_count: 0,
          last_entry_date: null
        })
      }

      const user = userMap.get(entry.user_id)!
      user.total_hours += entry.hours_worked || 0
      user.entries_count += 1
      
      if (entry.date && (!user.last_entry_date || entry.date > user.last_entry_date)) {
        user.last_entry_date = entry.date
      }
    })

    // Get profile information for each user
    const userIds = Array.from(userMap.keys())
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    if (profileError) {
      console.error('Error fetching profiles:', profileError)
      return []
    }

    // Combine data
    return userIds.map(userId => {
      const profile = profiles?.find(p => p.id === userId)
      const stats = userMap.get(userId)!
      
      return {
        user_id: userId,
        full_name: profile?.full_name || 'Unknown User',
        email: profile?.email || '',
        total_hours: stats.total_hours,
        entries_count: stats.entries_count,
        last_entry_date: stats.last_entry_date
      }
    })
  } catch (error) {
    console.error('Error in getProjectEmployees:', error)
    return []
  }
}

// Get total time spent on project
export async function getProjectTotalTime(projectId: string): Promise<number> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('timesheet_entries')
      .select('hours_worked')
      .eq('project_id', projectId)

    if (error) {
      console.error('Error fetching project total time:', error)
      return 0
    }

    return data?.reduce((sum, entry) => sum + (entry.hours_worked || 0), 0) || 0
  } catch (error) {
    console.error('Error in getProjectTotalTime:', error)
    return 0
  }
}

// Get available employees (team members not yet assigned to project)
export async function getAvailableEmployees(managerId: string, projectId: string): Promise<Array<{ id: string; full_name: string; email: string }>> {
  try {
    const supabase = createClient()
    
    // Get current project employees
    const projectEmployees = await getProjectEmployees(projectId)
    const assignedUserIds = projectEmployees.map(emp => emp.user_id)

    // Get all team members (employees)
    let query = supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'employee')

    const { data: allEmployees, error } = await query

    if (error) {
      console.error('Error fetching available employees:', error)
      return []
    }

    // Filter out already assigned employees
    if (assignedUserIds.length > 0) {
      return (allEmployees || []).filter(emp => !assignedUserIds.includes(emp.id))
    }

    return allEmployees || []
  } catch (error) {
    console.error('Error in getAvailableEmployees:', error)
    return []
  }
}

// Assign employee to project (create initial timesheet entry)
export async function assignEmployeeToProject(
  projectId: string,
  userId: string,
  managerId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createClient()
    
    // First, check if employee is already assigned to this project
    // (has any timesheet entries for this project)
    const { data: existingEntries, error: checkError } = await supabase
      .from('timesheet_entries')
      .select('id')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .limit(1)

    if (checkError) {
      console.error('Error checking existing assignments:', checkError)
      return {
        success: false,
        message: 'Failed to check existing assignment'
      }
    }

    // If employee already has entries for this project, they're already assigned
    if (existingEntries && existingEntries.length > 0) {
      return {
        success: true,
        message: 'Employee is already assigned to this project'
      }
    }
    
    // Get current date
    const today = new Date().toISOString().split('T')[0]
    
    // Check if there's already an entry for today (to handle UNIQUE constraint)
    const { data: todayEntry, error: todayCheckError } = await supabase
      .from('timesheet_entries')
      .select('id')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .eq('date', today)
      .limit(1)

    if (todayCheckError) {
      console.error('Error checking today\'s entry:', todayCheckError)
      return {
        success: false,
        message: 'Failed to check existing entries'
      }
    }

    if (todayEntry && todayEntry.length > 0) {
      // Entry already exists for today, employee is assigned
      return {
        success: true,
        message: 'Employee is already assigned to this project'
      }
    }
    
    // Create a placeholder timesheet entry with minimum valid hours (0.25)
    // The CHECK constraint requires hours_worked > 0, so we use 0.25 (15 minutes)
    // This serves as an assignment marker and can be updated later with actual hours
    const { error } = await supabase
      .from('timesheet_entries')
      .insert({
        user_id: userId,
        project_id: projectId,
        date: today,
        hours_worked: 0.25, // Minimum valid value instead of 0
        description: 'Assigned to project',
        status: 'approved',
        approved_by: managerId,
        approved_at: new Date().toISOString(),
        billable: false // Mark assignment entries as non-billable
      })
      .select()
      .single()

    if (error) {
      console.error('Error assigning employee to project:', error)
      
      // Handle specific error cases
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        return {
          success: true,
          message: 'Employee is already assigned to this project'
        }
      }
      
      return {
        success: false,
        message: error.message || 'Failed to assign employee to project. Please try again.'
      }
    }

    return {
      success: true,
      message: 'Employee assigned to project successfully'
    }
  } catch (error) {
    console.error('Error in assignEmployeeToProject:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return {
      success: false,
      message: errorMessage
    }
  }
}

// Remove employee from project (delete all their timesheet entries)
export async function removeEmployeeFromProject(
  projectId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('timesheet_entries')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing employee from project:', error)
      return {
        success: false,
        message: error.message || 'Failed to remove employee from project'
      }
    }

    return {
      success: true,
      message: 'Employee removed from project successfully'
    }
  } catch (error) {
    console.error('Error in removeEmployeeFromProject:', error)
    return {
      success: false,
      message: 'An unexpected error occurred'
    }
  }
}

// Get user's assigned projects
export async function getUserAssignedProjects(userId: string): Promise<Project[]> {
  try {
    const supabase = createClient()
    
    // Get distinct project_ids from timesheet entries for this user
    const { data: timesheetData, error: timesheetError } = await supabase
      .from('timesheet_entries')
      .select('project_id')
      .eq('user_id', userId)

    if (timesheetError) {
      console.error('Error fetching user timesheet entries:', timesheetError)
      return []
    }

    const projectIds = Array.from(new Set(timesheetData?.map(entry => entry.project_id) || []))

    if (projectIds.length === 0) {
      return []
    }

    // Get project details
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds)
      .order('created_at', { ascending: false })

    if (projectError) {
      console.error('Error fetching projects:', projectError)
      return []
    }

    return projects || []
  } catch (error) {
    console.error('Error in getUserAssignedProjects:', error)
    return []
  }
}

// Get timesheet entries for a user's specific project
export async function getUserProjectTimesheetEntries(
  userId: string,
  projectId: string
): Promise<Array<{
  id: string
  date: string
  hours_worked: number
  description: string
  task_category: string | null
  billable: boolean
  status: string
  created_at: string
}>> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('timesheet_entries')
      .select('id, date, hours_worked, description, task_category, billable, status, created_at')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching project timesheet entries:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserProjectTimesheetEntries:', error)
    return []
  }
}

// Get total hours worked by user on a specific project
export async function getUserProjectTotalHours(
  userId: string,
  projectId: string
): Promise<number> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('timesheet_entries')
      .select('hours_worked')
      .eq('user_id', userId)
      .eq('project_id', projectId)

    if (error) {
      console.error('Error fetching project total hours:', error)
      return 0
    }

    return data?.reduce((sum, entry) => sum + (entry.hours_worked || 0), 0) || 0
  } catch (error) {
    console.error('Error in getUserProjectTotalHours:', error)
    return 0
  }
}

// Get tasks for a user's specific project
export async function getUserProjectTasks(
  userId: string,
  projectId: string
): Promise<Array<{
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  created_at: string
}>> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, description, status, priority, due_date, created_at')
      .eq('assigned_to', userId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching project tasks:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserProjectTasks:', error)
    return []
  }
}
