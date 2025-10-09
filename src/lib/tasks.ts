import { supabase } from './supabase'

export interface Task {
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
  project_name?: string
  assigned_by_name?: string
}

export interface TaskStats {
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  in_progress_tasks: number
  overdue_tasks: number
  completion_rate: number
}

export interface TaskResponse {
  success: boolean
  message: string
  data: Task | null
}

export interface Project {
  id: string
  name: string
  description: string
  status: string
  priority: string
  start_date: string
  end_date: string
}

// Get user tasks with optional status filter
export async function getUserTasks(
  userId: string, 
  statusFilter?: string
): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_tasks', { 
        user_uuid: userId, 
        status_filter: statusFilter || null 
      })

    if (error) {
      console.error('Error fetching user tasks:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserTasks:', error)
    return []
  }
}

// Get task statistics for a user
export async function getUserTaskStats(userId: string): Promise<TaskStats | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_task_stats', { user_uuid: userId })
      .single()

    if (error) {
      console.error('Error fetching task stats:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserTaskStats:', error)
    return null
  }
}

// Create a new task
export async function createTask(
  taskData: {
    title: string
    description?: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    assigned_to: string
    project_id?: string
    due_date?: string
    estimated_hours?: number
    tags?: string[]
  },
  assignedBy: string
): Promise<TaskResponse> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: taskData.title,
        description: taskData.description || null,
        priority: taskData.priority,
        assigned_to: taskData.assigned_to,
        assigned_by: assignedBy,
        project_id: taskData.project_id || null,
        due_date: taskData.due_date || null,
        estimated_hours: taskData.estimated_hours || null,
        tags: taskData.tags || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return {
        success: false,
        message: error.message || 'Failed to create task',
        data: null
      }
    }

    return {
      success: true,
      message: 'Task created successfully',
      data
    }
  } catch (error) {
    console.error('Error in createTask:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: null
    }
  }
}

// Update task status
export async function updateTaskStatus(
  taskId: string,
  newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold',
  userId: string
): Promise<TaskResponse> {
  try {
    const { data, error } = await supabase
      .rpc('update_task_status', {
        task_uuid: taskId,
        new_status: newStatus,
        user_uuid: userId
      })
      .single()

    if (error) {
      console.error('Error updating task status:', error)
      return {
        success: false,
        message: error.message || 'Failed to update task status',
        data: null
      }
    }

    return data
  } catch (error) {
    console.error('Error in updateTaskStatus:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: null
    }
  }
}

// Update task details
export async function updateTask(
  taskId: string,
  updates: {
    title?: string
    description?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    due_date?: string
    estimated_hours?: number
    actual_hours?: number
    tags?: string[]
  },
  userId: string
): Promise<TaskResponse> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('assigned_to', userId) // Only allow assigned user to update
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return {
        success: false,
        message: error.message || 'Failed to update task',
        data: null
      }
    }

    return {
      success: true,
      message: 'Task updated successfully',
      data
    }
  } catch (error) {
    console.error('Error in updateTask:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: null
    }
  }
}

// Delete a task
export async function deleteTask(taskId: string, userId: string): Promise<TaskResponse> {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('assigned_by', userId) // Only allow creator to delete

    if (error) {
      console.error('Error deleting task:', error)
      return {
        success: false,
        message: error.message || 'Failed to delete task',
        data: null
      }
    }

    return {
      success: true,
      message: 'Task deleted successfully',
      data: null
    }
  } catch (error) {
    console.error('Error in deleteTask:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: null
    }
  }
}

// Get task by ID with full details
export async function getTaskById(taskId: string): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        projects (
          id,
          name
        ),
        assigned_by_profile:profiles!tasks_assigned_by_fkey (
          id,
          full_name
        )
      `)
      .eq('id', taskId)
      .single()

    if (error) {
      console.error('Error fetching task:', error)
      return null
    }

    return {
      ...data,
      project_name: data.projects?.name,
      assigned_by_name: data.assigned_by_profile?.full_name
    }
  } catch (error) {
    console.error('Error in getTaskById:', error)
    return null
  }
}

// Get recent tasks for dashboard
export async function getRecentTasks(userId: string, limit: number = 5): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        projects (
          id,
          name
        )
      `)
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent tasks:', error)
      return []
    }

    return data?.map(task => ({
      ...task,
      project_name: task.projects?.name
    })) || []
  } catch (error) {
    console.error('Error in getRecentTasks:', error)
    return []
  }
}

// Get overdue tasks
export async function getOverdueTasks(userId: string): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        projects (
          id,
          name
        )
      `)
      .eq('assigned_to', userId)
      .neq('status', 'completed')
      .lt('due_date', new Date().toISOString().split('T')[0])
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Error fetching overdue tasks:', error)
      return []
    }

    return data?.map(task => ({
      ...task,
      project_name: task.projects?.name
    })) || []
  } catch (error) {
    console.error('Error in getOverdueTasks:', error)
    return []
  }
}

// Get available projects for task assignment
export async function getAvailableProjects(): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .in('status', ['planning', 'in_progress'])
      .lte('start_date', new Date().toISOString().split('T')[0])
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('priority', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching available projects:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAvailableProjects:', error)
    return []
  }
}
