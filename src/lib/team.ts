import { supabase } from './supabase'

export interface TeamMember {
  id: string
  email: string
  full_name: string
  role: 'employee' | 'manager' | 'admin'
  department: string | null
  position: string | null
  avatar_url: string | null
  manager_id: string | null
  created_at: string
  updated_at: string
  // Additional computed fields
  task_count?: number
  completed_tasks?: number
  status?: 'online' | 'away' | 'offline'
}

export interface TeamStats {
  total_members: number
  active_members: number
  completed_tasks: number
  total_tasks: number
  productivity_rate: number
}

// Get team members for a manager
export async function getTeamMembers(_managerId: string): Promise<TeamMember[]> {
  try {
    // Get all employees (non-manager, non-admin users) for the manager to see
    const { data: fallbackData, error: fallbackError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          department,
          position,
          avatar_url,
          manager_id,
          created_at,
          updated_at
        `)
        .in('role', ['employee'])
        .order('created_at', { ascending: false })

    if (fallbackError) {
      console.error('Error fetching team members:', fallbackError)
      return []
    }

    // Get task counts for each team member
    const teamMembersWithTasks = await Promise.all(
      (fallbackData || []).map(async (member) => {
        const { data: taskData } = await supabase
          .from('tasks')
          .select('id, status')
          .eq('assigned_to', member.id)

        const taskCount = taskData?.length || 0
        const completedTasks = taskData?.filter(task => task.status === 'completed').length || 0

        return {
          ...member,
          task_count: taskCount,
          completed_tasks: completedTasks,
          status: 'online' as const
        }
      })
    )

    return teamMembersWithTasks
  } catch (error) {
    console.error('Error in getTeamMembers:', error)
    return []
  }
}

// Get team statistics
export async function getTeamStats(_managerId: string): Promise<TeamStats | null> {
  try {
    // First try using the database function
    const { data, error } = await supabase
      .rpc('get_all_employees_stats')

    if (error) {
      console.error('Error fetching team stats via function:', error.message || error)
      
      // Fallback to direct queries - get all employees
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['employee'])

      // Get all employee IDs
      const { data: teamMemberIds } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['employee'])

      const memberIds = teamMemberIds?.map(member => member.id) || []

      // Get task statistics (only if there are team members)
      let taskData = []
      if (memberIds.length > 0) {
        const { data } = await supabase
          .from('tasks')
          .select('status')
          .in('assigned_to', memberIds)
        taskData = data || []
      }

      const totalTasks = taskData?.length || 0
      const completedTasks = taskData?.filter(task => task.status === 'completed').length || 0
      const productivityRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        total_members: totalMembers || 0,
        active_members: totalMembers || 0,
        completed_tasks: completedTasks,
        total_tasks: totalTasks,
        productivity_rate: productivityRate
      }
    }

    // Transform the function result
    const stats = data?.[0]
    if (!stats) return null

    return {
      total_members: Number(stats.total_members) || 0,
      active_members: Number(stats.active_members) || 0,
      completed_tasks: Number(stats.completed_tasks) || 0,
      total_tasks: Number(stats.total_tasks) || 0,
      productivity_rate: Number(stats.productivity_rate) || 0
    }
  } catch (error) {
    console.error('Error in getTeamStats:', error)
    return null
  }
}

// Get recent team activities
export async function getRecentTeamActivities(_managerId: string): Promise<{
  id: string
  user: string
  action: string
  task: string
  time: string
}[]> {
  try {
    // Get all employee IDs
    const { data: teamMemberIds } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['employee'])

    const memberIds = teamMemberIds?.map(member => member.id) || []

    // Get recent tasks for team members
    let fallbackData = []
    let fallbackError = null
    if (memberIds.length > 0) {
      const result = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          updated_at,
          assigned_to,
          profiles!tasks_assigned_to_fkey (
            full_name
          )
        `)
        .in('assigned_to', memberIds)
        .order('updated_at', { ascending: false })
        .limit(10)
      fallbackData = result.data || []
      fallbackError = result.error
    }

    if (fallbackError) {
      console.error('Error fetching recent activities:', fallbackError)
      return []
    }

    return (fallbackData || []).map(task => ({
      id: task.id,
      user: task.profiles?.full_name || 'Unknown User',
      action: task.status === 'completed' ? 'completed task' : 'updated task',
      task: task.title,
      time: new Date(task.updated_at).toLocaleString()
    }))
  } catch (error) {
    console.error('Error in getRecentTeamActivities:', error)
    return []
  }
}

// Get upcoming deadlines for team projects
export async function getUpcomingDeadlines(managerId: string): Promise<{
  project: string
  deadline: string
  status: string
  priority: string
}[]> {
  try {
    // First try using the database function
    const { data, error } = await supabase
      .rpc('get_upcoming_deadlines', { 
        manager_uuid: managerId, 
        limit_count: 5 
      })

    if (error) {
      console.error('Error fetching upcoming deadlines via function:', error.message || error)
      
      // Fallback to direct query
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          end_date,
          status,
          priority
        `)
        .eq('created_by', managerId)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('end_date', { ascending: true })
        .limit(5)

      if (fallbackError) {
        console.error('Error fetching upcoming deadlines via fallback:', fallbackError)
        return []
      }

      return (fallbackData || []).map(project => ({
        project: project.name,
        deadline: new Date(project.end_date).toLocaleDateString(),
        status: project.status === 'in_progress' ? 'On Track' : 
                project.status === 'planning' ? 'At Risk' : 'On Track',
        priority: project.priority
      }))
    }

    // Transform the function result
    return (data || []).map(deadline => ({
      project: deadline.project_name,
      deadline: new Date(deadline.deadline).toLocaleDateString(),
      status: deadline.status,
      priority: deadline.priority
    }))
  } catch (error) {
    console.error('Error in getUpcomingDeadlines:', error)
    return []
  }
}

// Assign team member to manager
export async function assignTeamMember(employeeId: string, managerId: string): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ manager_id: managerId })
      .eq('id', employeeId)
      .eq('role', 'employee') // Only allow assigning employees

    if (error) {
      console.error('Error assigning team member:', error)
      return { success: false, message: 'Failed to assign team member' }
    }

    return { success: true, message: 'Team member assigned successfully' }
  } catch (error) {
    console.error('Error in assignTeamMember:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}

// Remove team member from manager
export async function removeTeamMember(employeeId: string): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ manager_id: null })
      .eq('id', employeeId)

    if (error) {
      console.error('Error removing team member:', error)
      return { success: false, message: 'Failed to remove team member' }
    }

    return { success: true, message: 'Team member removed successfully' }
  } catch (error) {
    console.error('Error in removeTeamMember:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}
