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
