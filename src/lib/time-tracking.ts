import { supabase, supabaseAdmin } from './supabase'
import { TimeTracking } from './database.types'

export interface TimeTrackingStatus {
  is_clocked_in: boolean
  current_time_in: string | null
  today_total_hours: number
  status: string
}

export interface ClockInOutResponse {
  success: boolean
  message: string
  data: TimeTracking | null
}

// Get current time tracking status for a user
export async function getCurrentTimeStatus(userId: string): Promise<TimeTrackingStatus | null> {
  try {
    // Check if time_tracking table exists
    const { data: testData, error: testError } = await supabase
      .from('time_tracking')
      .select('id')
      .limit(1)

    if (testError && testError.code === 'PGRST116') {
      // Table doesn't exist yet, return default status
      console.log('Time tracking tables not yet created. Please run the database schema.')
      return {
        is_clocked_in: false,
        current_time_in: null,
        today_total_hours: 0,
        status: 'offline'
      }
    }

    // Try RPC function first
    const { data, error } = await supabase
      .rpc('get_current_time_status', { user_uuid: userId })
      .single()

    if (error) {
      console.log('RPC function not available, using direct query')
      
      // Fallback to direct query
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('time_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('date', new Date().toISOString().split('T')[0])
        .order('clock_in_time', { ascending: false })
        .limit(1)

      if (fallbackError) {
        console.error('Error fetching time status via fallback:', fallbackError)
        // Return default status instead of null to prevent crashes
        return {
          is_clocked_in: false,
          current_time_in: null,
          today_total_hours: 0,
          status: 'offline'
        }
      }

      const record = fallbackData?.[0]
      if (!record) {
        return {
          is_clocked_in: false,
          current_time_in: null,
          today_total_hours: 0,
          status: 'offline'
        }
      }

      const isClockedIn = !record.clock_out_time
      const todayTotalHours = record.total_hours || 0

      return {
        is_clocked_in: isClockedIn,
        current_time_in: isClockedIn ? record.clock_in_time : null,
        today_total_hours: todayTotalHours,
        status: isClockedIn ? 'online' : 'offline'
      }
    }

    return data as TimeTrackingStatus | null
  } catch (error) {
    console.error('Error in getCurrentTimeStatus:', error)
    // Return default status instead of null to prevent crashes
    return {
      is_clocked_in: false,
      current_time_in: null,
      today_total_hours: 0,
      status: 'offline'
    }
  }
}

// Clock in function
export async function clockIn(userId: string, notes?: string): Promise<ClockInOutResponse> {
  try {
    const { data, error } = await supabase
      .rpc('clock_in', { 
        user_uuid: userId, 
        notes_text: notes || null 
      })
      .single()

    if (error) {
      console.error('Error clocking in:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return {
        success: false,
        message: error.message || 'Failed to clock in',
        data: null
      }
    }

    return data
  } catch (error) {
    console.error('Error in clockIn:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: null
    }
  }
}

// Clock out function
export async function clockOut(userId: string, notes?: string): Promise<ClockInOutResponse> {
  try {
    const { data, error } = await supabase
      .rpc('clock_out', { 
        user_uuid: userId, 
        notes_text: notes || null 
      })
      .single()

    if (error) {
      console.error('Error clocking out:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return {
        success: false,
        message: error.message || 'Failed to clock out',
        data: null
      }
    }

    return data
  } catch (error) {
    console.error('Error in clockOut:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: null
    }
  }
}

// Get time tracking history for a user
export async function getTimeTrackingHistory(
  userId: string, 
  startDate?: string, 
  endDate?: string
): Promise<TimeTracking[]> {
  try {
    let query = supabase
      .from('time_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching time tracking history:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getTimeTrackingHistory:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    return []
  }
}

// Get today's time tracking record
export async function getTodayTimeTracking(userId: string): Promise<TimeTracking | null> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('time_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found for today
        return null
      }
      console.error('Error fetching today\'s time tracking:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getTodayTimeTracking:', error)
    return null
  }
}

// Calculate total hours worked this week
export async function getWeeklyHours(userId: string): Promise<number> {
  try {
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startDate = startOfWeek.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('time_tracking')
      .select('total_hours')
      .eq('user_id', userId)
      .gte('date', startDate)

    if (error) {
      console.error('Error fetching weekly hours:', error)
      return 0
    }

    return data?.reduce((total, record) => total + (record.total_hours || 0), 0) || 0
  } catch (error) {
    console.error('Error in getWeeklyHours:', error)
    return 0
  }
}

// Manager-specific functions for viewing team time tracking data

export interface ManagerTimeTrackingSummary {
  employeeId: string
  employeeName: string
  todayStatus: 'clocked_in' | 'clocked_out' | 'on_break' | 'not_tracked'
  todayHours: number
  weeklyHours: number
  monthlyHours: number
  lastClockIn: string | null
  lastClockOut: string | null
  currentSessionDuration: number | null
  totalSessions: number
  averageDailyHours: number
}

export interface ManagerTimeTrackingDetails {
  employeeId: string
  employeeName: string
  timeEntries: Array<{
    id: string
    date: string
    timeIn: string | null
    timeOut: string | null
    totalHours: number
    breakDurationMinutes: number
    status: string
    notes: string | null
    createdAt: string
  }>
  weeklySummary: Array<{
    weekStart: string
    weekEnd: string
    totalHours: number
    daysWorked: number
    averageHoursPerDay: number
  }>
  monthlySummary: {
    totalHours: number
    daysWorked: number
    averageHoursPerDay: number
    currentMonthHours: number
  }
}

// Get time tracking summary for all team members
export async function getTeamTimeTrackingSummary(managerId: string): Promise<ManagerTimeTrackingSummary[]> {
  try {
    // First get team members
    const { data: teamData, error: teamError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('manager_id', managerId)
      .eq('role', 'employee')

    if (teamError) {
      console.error('Error fetching team members:', teamError)
      return []
    }

    if (!teamData || teamData.length === 0) {
      return []
    }

    const teamMemberIds = teamData.map(member => member.id)

    // Get time tracking data for all team members
    const { data: timeData, error: timeError } = await supabaseAdmin
      .from('time_tracking')
      .select('*')
      .in('user_id', teamMemberIds)
      .order('date', { ascending: false })

    if (timeError) {
      console.error('Error fetching time tracking data:', timeError)
      return []
    }

    // Process data for each team member
    return teamData.map(member => {
      const memberTimeEntries = (timeData || []).filter(entry => entry.user_id === member.id)
      
      // Today's data
      const today = new Date().toISOString().split('T')[0]
      const todayEntry = memberTimeEntries.find(entry => entry.date === today)
      
      // Weekly data (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const weeklyEntries = memberTimeEntries.filter(entry => entry.date >= weekAgo)
      
      // Monthly data (last 30 days)
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const monthlyEntries = memberTimeEntries.filter(entry => entry.date >= monthAgo)
      
      // Current month data
      const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      const currentMonthEntries = memberTimeEntries.filter(entry => entry.date >= currentMonthStart)
      
      // Calculate metrics
      const todayHours = todayEntry?.total_hours || 0
      const weeklyHours = weeklyEntries.reduce((total, entry) => total + (entry.total_hours || 0), 0)
      const monthlyHours = monthlyEntries.reduce((total, entry) => total + (entry.total_hours || 0), 0)
      const currentMonthHours = currentMonthEntries.reduce((total, entry) => total + (entry.total_hours || 0), 0)
      
      // Current session duration (if clocked in)
      let currentSessionDuration = null
      if (todayEntry?.status === 'clocked_in' && todayEntry.time_in) {
        const clockInTime = new Date(todayEntry.time_in)
        const now = new Date()
        currentSessionDuration = Math.floor((now.getTime() - clockInTime.getTime()) / (1000 * 60)) // minutes
      }
      
      // Average daily hours
      const daysWorked = monthlyEntries.filter(entry => entry.total_hours > 0).length
      const averageDailyHours = daysWorked > 0 ? monthlyHours / daysWorked : 0
      
      return {
        employeeId: member.id,
        employeeName: member.full_name,
        todayStatus: todayEntry?.status as 'clocked_in' | 'clocked_out' | 'on_break' | 'not_tracked' || 'not_tracked',
        todayHours,
        weeklyHours,
        monthlyHours,
        lastClockIn: todayEntry?.time_in || null,
        lastClockOut: todayEntry?.time_out || null,
        currentSessionDuration,
        totalSessions: memberTimeEntries.length,
        averageDailyHours
      }
    })
  } catch (error) {
    console.error('Error in getTeamTimeTrackingSummary:', error)
    return []
  }
}

// Get detailed time tracking data for a specific employee
export async function getEmployeeTimeTrackingDetails(employeeId: string): Promise<ManagerTimeTrackingDetails | null> {
  try {
    // Get employee profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('id', employeeId)
      .single()

    if (profileError) {
      console.error('Error fetching employee profile:', profileError)
      return null
    }

    // Get all time tracking data for the employee
    const { data: timeData, error: timeError } = await supabaseAdmin
      .from('time_tracking')
      .select('*')
      .eq('user_id', employeeId)
      .order('date', { ascending: false })

    if (timeError) {
      console.error('Error fetching time tracking data:', timeError)
      return null
    }

    const timeEntries = (timeData || []).map(entry => ({
      id: entry.id,
      date: entry.date,
      timeIn: entry.time_in,
      timeOut: entry.time_out,
      totalHours: entry.total_hours,
      breakDurationMinutes: entry.break_duration_minutes,
      status: entry.status,
      notes: entry.notes,
      createdAt: entry.created_at
    }))

    // Calculate weekly summaries
    const weeklySummaries = []
    const entriesByWeek = new Map<string, typeof timeEntries>()
    
    timeEntries.forEach(entry => {
      const date = new Date(entry.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (!entriesByWeek.has(weekKey)) {
        entriesByWeek.set(weekKey, [])
      }
      entriesByWeek.get(weekKey)!.push(entry)
    })

    entriesByWeek.forEach((weekEntries, weekStart) => {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const totalHours = weekEntries.reduce((total, entry) => total + entry.totalHours, 0)
      const daysWorked = weekEntries.filter(entry => entry.totalHours > 0).length
      const averageHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0
      
      weeklySummaries.push({
        weekStart,
        weekEnd: weekEnd.toISOString().split('T')[0],
        totalHours,
        daysWorked,
        averageHoursPerDay
      })
    })

    // Calculate monthly summary
    const monthlyEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date)
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return entryDate >= monthAgo
    })

    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const currentMonthEntries = timeEntries.filter(entry => entry.date >= currentMonthStart)

    const totalHours = monthlyEntries.reduce((total, entry) => total + entry.totalHours, 0)
    const daysWorked = monthlyEntries.filter(entry => entry.totalHours > 0).length
    const averageHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0
    const currentMonthHours = currentMonthEntries.reduce((total, entry) => total + entry.totalHours, 0)

    return {
      employeeId: profile.id,
      employeeName: profile.full_name,
      timeEntries,
      weeklySummary: weeklySummaries.slice(0, 8), // Last 8 weeks
      monthlySummary: {
        totalHours,
        daysWorked,
        averageHoursPerDay,
        currentMonthHours
      }
    }
  } catch (error) {
    console.error('Error in getEmployeeTimeTrackingDetails:', error)
    return null
  }
}
