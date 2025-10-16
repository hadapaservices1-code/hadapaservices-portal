import { supabase, supabaseAdmin } from './supabase'

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

export interface EmployeeActivity {
  pendingLeaves: number
  approvedLeaves: number
  totalLeaves: number
  totalHoursThisWeek: number
  activeTasks: number
  completedTasks: number
  totalTasks: number
  lastActivity: string
}

export interface TeamMemberWithActivity extends TeamMember {
  activity: EmployeeActivity
  recentLeaves: Array<{
    id: string
    status: string
    start_date: string
    end_date: string
    applied_at: string
    leave_types?: { name: string }
  }>
  recentTimeEntries: Array<{
    id: string
    date: string
    total_hours: number
    status: string
    time_in: string | null
    time_out: string | null
    created_at: string
  }>
  recentTasks: Array<{
    id: string
    title: string
    description?: string
    status: string
    priority: string
    due_date: string
    created_at: string
  }>
}

export interface EmployeeActivityDetails {
  profile: TeamMember
  leaveRequests: Array<{
    id: string
    status: string
    start_date: string
    end_date: string
    applied_at: string
    leave_types?: { name: string }
  }>
  timeEntries: Array<{
    id: string
    date: string
    total_hours: number
    status: string
    time_in: string | null
    time_out: string | null
    created_at: string
  }>
  tasks: Array<{
    id: string
    title: string
    description?: string
    status: string
    priority: string
    due_date: string
    created_at: string
  }>
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
    // Use direct queries instead of database functions
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let taskData: any[] = []
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
      active_members: totalMembers || 0, // Using total as active for now
        completed_tasks: completedTasks,
        total_tasks: totalTasks,
        productivity_rate: productivityRate
    }
  } catch (error) {
    console.error('Error in getTeamStats:', error)
    return {
      total_members: 0,
      active_members: 0,
      completed_tasks: 0,
      total_tasks: 0,
      productivity_rate: 0
    }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fallbackData: any[] = []
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
    // Use direct query instead of database function
    const { data: projectData, error } = await supabase
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

    if (error) {
      console.error('Error fetching upcoming deadlines:', error)
        return []
      }

    return (projectData || []).map(project => ({
        project: project.name,
        deadline: new Date(project.end_date).toLocaleDateString(),
        status: project.status === 'in_progress' ? 'On Track' : 
                project.status === 'planning' ? 'At Risk' : 'On Track',
      priority: project.priority || 'medium'
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

// Get team members with activity data for manager dashboard
export async function getTeamMembersWithActivity(managerId: string): Promise<TeamMemberWithActivity[]> {
  try {
    // Get team members
    const { data: teamData, error: teamError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        department,
        position,
        avatar_url,
        manager_id,
        created_at,
        updated_at
      `)
      .eq('manager_id', managerId)
      .eq('role', 'employee')
      .order('full_name')

    if (teamError) {
      console.error('Error fetching team members:', teamError)
      return []
    }

    if (!teamData || teamData.length === 0) {
      return []
    }

    // Get leave requests for all team members
    const { data: leaveData, error: leaveError } = await supabaseAdmin
      .from('leave_requests')
      .select(`
        id,
        employee_id,
        status,
        start_date,
        end_date,
        applied_at,
        reviewed_at,
        leave_types(name)
      `)
      .in('employee_id', teamData.map(member => member.id))
      .order('applied_at', { ascending: false })

    if (leaveError) {
      console.error('Error fetching leave data:', leaveError)
    }

    // Get time tracking data for all team members (if available)
    const { data: timeData, error: timeError } = await supabaseAdmin
      .from('time_tracking') // Use actual time_tracking table
      .select(`
        id,
        user_id,
        date,
        total_hours,
        status,
        time_in,
        time_out,
        created_at
      `)
      .in('user_id', teamData.map(member => member.id))
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('date', { ascending: false })

    if (timeError) {
      console.error('Error fetching time data:', timeError)
    }

    // Get task data for all team members (if available)
    const { data: taskData, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select(`
        id,
        assigned_to,
        status,
        priority,
        due_date,
        created_at,
        updated_at
      `)
      .in('assigned_to', teamData.map(member => member.id))
      .order('created_at', { ascending: false })

    if (taskError) {
      console.error('Error fetching task data:', taskError)
    }

    // Combine data for each team member
    return teamData.map(member => {
      const memberLeaves = (leaveData || []).filter(leave => leave.employee_id === member.id)
      const memberTimeEntries = (timeData || []).filter(time => time.user_id === member.id)
      const memberTasks = (taskData || []).filter(task => task.assigned_to === member.id)

      // Calculate activity metrics
      const pendingLeaves = memberLeaves.filter(leave => leave.status === 'pending').length
      const approvedLeaves = memberLeaves.filter(leave => leave.status === 'approved').length
      const totalHoursThisWeek = memberTimeEntries
        .filter(entry => {
          const entryDate = new Date(entry.date)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return entryDate >= weekAgo
        })
        .reduce((total, entry) => total + (entry.total_hours || 0), 0)
      
      const activeTasks = memberTasks.filter(task => 
        task.status === 'in_progress' || task.status === 'pending'
      ).length
      
      const completedTasks = memberTasks.filter(task => task.status === 'completed').length

      return {
        ...member,
        activity: {
          pendingLeaves,
          approvedLeaves,
          totalLeaves: memberLeaves.length,
          totalHoursThisWeek,
          activeTasks,
          completedTasks,
          totalTasks: memberTasks.length,
          lastActivity: memberLeaves[0]?.applied_at || memberTimeEntries[0]?.created_at || member.created_at
        },
        recentLeaves: memberLeaves.slice(0, 3).map(leave => ({
          id: leave.id as string,
          status: leave.status as string,
          start_date: leave.start_date as string,
          end_date: leave.end_date as string,
          applied_at: leave.applied_at as string,
          leave_types: leave.leave_types?.[0] ? { name: leave.leave_types[0].name as string } : undefined
        })),
        recentTimeEntries: memberTimeEntries.slice(0, 5),
        recentTasks: memberTasks.slice(0, 3).map(task => ({
          id: task.id as string,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          title: (task as any).title as string || 'Untitled Task',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          description: (task as any).description as string,
          status: task.status as string,
          priority: task.priority as string,
          due_date: task.due_date as string,
          created_at: task.created_at as string
        }))
      }
    })
  } catch (error) {
    console.error('Error in getTeamMembersWithActivity:', error)
    return []
  }
}

// Get detailed employee activity data
export async function getEmployeeActivityDetails(employeeId: string): Promise<EmployeeActivityDetails> {
  try {
    // Get employee profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', employeeId)
      .single()

    if (profileError) {
      console.error('Error fetching employee profile:', profileError)
      throw new Error('Employee not found')
    }

    // Get all leave requests
    const { data: leaveData, error: leaveError } = await supabaseAdmin
      .from('leave_requests')
      .select(`
        *,
        leave_types(name)
      `)
      .eq('employee_id', employeeId)
      .order('applied_at', { ascending: false })

    if (leaveError) {
      console.error('Error fetching leave data:', leaveError)
    }

    // Get time tracking data
    const { data: timeData, error: timeError } = await supabaseAdmin
      .from('time_tracking') // Use actual time_tracking table
      .select('*')
      .eq('user_id', employeeId)
      .order('date', { ascending: false })

    if (timeError) {
      console.error('Error fetching time data:', timeError)
    }

    // Get task data
    const { data: taskData, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('assigned_to', employeeId)
      .order('created_at', { ascending: false })

    if (taskError) {
      console.error('Error fetching task data:', taskError)
    }

    return {
      profile,
      leaveRequests: leaveData || [],
      timeEntries: timeData || [],
      tasks: taskData || []
    }
  } catch (error) {
    console.error('Error in getEmployeeActivityDetails:', error)
    throw error
  }
}
