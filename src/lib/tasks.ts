import { supabase } from './supabase'
import { TimesheetEntry } from './timesheet'

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
  // Timesheet integration fields
  is_timesheet_entry?: boolean
  timesheet_entry_id?: string
  hours_worked?: number
  task_category?: string
  billable?: boolean
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

// Convert timesheet entry to task format
function convertTimesheetEntryToTask(entry: TimesheetEntry, projectName?: string): Task {
  return {
    id: `timesheet_${entry.id}`,
    title: `${entry.task_category || 'Work'} - ${projectName || 'Project'}`,
    description: entry.description,
    status: entry.status === 'approved' ? 'completed' : 
            entry.status === 'submitted' ? 'in_progress' : 'pending',
    priority: 'medium',
    assigned_to: entry.user_id,
    assigned_by: entry.user_id, // Self-assigned from timesheet
    project_id: entry.project_id,
    due_date: entry.date,
    completed_at: entry.status === 'approved' ? entry.updated_at : null,
    estimated_hours: null,
    actual_hours: entry.hours_worked,
    tags: entry.task_category ? [entry.task_category] : null,
    created_at: entry.created_at,
    updated_at: entry.updated_at,
    project_name: projectName,
    assigned_by_name: 'Self',
    // Timesheet integration fields
    is_timesheet_entry: true,
    timesheet_entry_id: entry.id,
    hours_worked: entry.hours_worked,
    task_category: entry.task_category || undefined,
    billable: entry.billable
  }
}

// Get user tasks with optional status filter (includes timesheet entries)
export async function getUserTasks(
  userId: string, 
  statusFilter?: string
): Promise<Task[]> {
  try {
    // Get regular tasks
    const { data: tasksData, error: tasksError } = await supabase
      .rpc('get_user_tasks', { 
        user_uuid: userId, 
        status_filter: statusFilter || null 
      })

    if (tasksError) {
      console.error('Error fetching user tasks:', tasksError)
    }

    // Get timesheet entries
    const { data: timesheetData, error: timesheetError } = await supabase
      .from('timesheet_entries')
      .select(`
        *,
        projects (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (timesheetError) {
      console.error('Error fetching timesheet entries:', timesheetError)
    }

    // Convert timesheet entries to tasks
    const timesheetTasks = (timesheetData || []).map(entry => 
      convertTimesheetEntryToTask(entry, entry.projects?.name)
    )

    // Filter timesheet tasks by status if needed
    let filteredTimesheetTasks = timesheetTasks
    if (statusFilter && statusFilter !== 'all') {
      filteredTimesheetTasks = timesheetTasks.filter(task => {
        if (statusFilter === 'completed') return task.status === 'completed'
        if (statusFilter === 'in_progress') return task.status === 'in_progress'
        if (statusFilter === 'pending') return task.status === 'pending'
        return true
      })
    }

    // Combine regular tasks and timesheet tasks
    const allTasks = [
      ...(tasksData || []),
      ...filteredTimesheetTasks
    ]

    // Sort by creation date (newest first)
    return allTasks.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } catch (error) {
    console.error('Error in getUserTasks:', error)
    return []
  }
}

// Get task statistics for a user (includes timesheet entries)
export async function getUserTaskStats(userId: string): Promise<TaskStats | null> {
  try {
    // Get regular task stats
    const { data: taskStats, error: taskError } = await supabase
      .rpc('get_user_task_stats', { user_uuid: userId })
      .single()

    if (taskError) {
      console.error('Error fetching task stats:', taskError)
    }

    // Get timesheet entries for stats
    const { data: timesheetData, error: timesheetError } = await supabase
      .from('timesheet_entries')
      .select('status, created_at')
      .eq('user_id', userId)

    if (timesheetError) {
      console.error('Error fetching timesheet stats:', timesheetError)
    }

    // Calculate timesheet stats
    const timesheetStats = {
      total_tasks: 0,
      completed_tasks: 0,
      pending_tasks: 0,
      in_progress_tasks: 0,
      overdue_tasks: 0,
      completion_rate: 0
    }

    if (timesheetData) {
      timesheetStats.total_tasks = timesheetData.length
      timesheetStats.completed_tasks = timesheetData.filter(entry => entry.status === 'approved').length
      timesheetStats.pending_tasks = timesheetData.filter(entry => entry.status === 'draft').length
      timesheetStats.in_progress_tasks = timesheetData.filter(entry => entry.status === 'submitted').length
      timesheetStats.completion_rate = timesheetStats.total_tasks > 0 
        ? Math.round((timesheetStats.completed_tasks / timesheetStats.total_tasks) * 100) 
        : 0
    }

    // Combine regular task stats with timesheet stats
    const regularStats = taskStats || {
      total_tasks: 0,
      completed_tasks: 0,
      pending_tasks: 0,
      in_progress_tasks: 0,
      overdue_tasks: 0,
      completion_rate: 0
    }

    // Create proper type definitions to avoid using 'any'
    const regularStatsTyped = regularStats as {
      total_tasks: number;
      completed_tasks: number;
      pending_tasks: number;
      in_progress_tasks: number;
      overdue_tasks: number;
    };
    
    const timesheetStatsTyped = timesheetStats as {
      total_tasks: number;
      completed_tasks: number;
      pending_tasks: number;
      in_progress_tasks: number;
      overdue_tasks: number;
    };

    return {
      total_tasks: regularStatsTyped.total_tasks + timesheetStatsTyped.total_tasks,
      completed_tasks: regularStatsTyped.completed_tasks + timesheetStatsTyped.completed_tasks,
      pending_tasks: regularStatsTyped.pending_tasks + timesheetStatsTyped.pending_tasks,
      in_progress_tasks: regularStatsTyped.in_progress_tasks + timesheetStatsTyped.in_progress_tasks,
      overdue_tasks: regularStatsTyped.overdue_tasks + timesheetStatsTyped.overdue_tasks,
      completion_rate: regularStatsTyped.total_tasks + timesheetStatsTyped.total_tasks > 0
        ? Math.round(((regularStatsTyped.completed_tasks + timesheetStatsTyped.completed_tasks) / 
           (regularStatsTyped.total_tasks + timesheetStatsTyped.total_tasks)) * 100)
        : 0
    }
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

    return data as TaskResponse
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
