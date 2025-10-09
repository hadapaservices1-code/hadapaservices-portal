import { supabase } from './supabase'
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

    return data
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
      console.error('Error clocking in:', error)
      return {
        success: false,
        message: error.message || 'Failed to clock in',
        data: null
      }
    }

    return data
  } catch (error) {
    console.error('Error in clockIn:', error)
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
      console.error('Error clocking out:', error)
      return {
        success: false,
        message: error.message || 'Failed to clock out',
        data: null
      }
    }

    return data
  } catch (error) {
    console.error('Error in clockOut:', error)
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
      console.error('Error fetching time tracking history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getTimeTrackingHistory:', error)
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
      console.error('Error fetching today\'s time tracking:', error)
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
