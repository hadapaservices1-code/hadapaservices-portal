import { supabase } from './supabase'
import { TimesheetEntry, TimesheetSubmission } from './database.types'

// Re-export types for use in components
export type { TimesheetEntry, TimesheetSubmission }

export interface Project {
  id: string
  name: string
  description: string
  status: string
  priority: string
  start_date: string
  end_date: string
}

export interface TimesheetSummary {
  project_id: string
  project_name: string
  total_hours: number
  total_entries: number
  last_entry_date: string
}

export interface TimesheetResponse {
  success: boolean
  message: string
  data: unknown
}

// Get available projects for a user
export async function getAvailableProjects(userId: string): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_available_projects_for_user', { user_uuid: userId })

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

// Create a new timesheet entry
export async function createTimesheetEntry(
  userId: string,
  entryData: {
    project_id: string
    date: string
    hours_worked: number
    description: string
    task_category: string
    billable: boolean
  }
): Promise<TimesheetResponse> {
  try {
    const { data, error } = await supabase
      .from('timesheet_entries')
      .insert({
        user_id: userId,
        project_id: entryData.project_id,
        date: entryData.date,
        hours_worked: entryData.hours_worked,
        description: entryData.description,
        task_category: entryData.task_category,
        billable: entryData.billable,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating timesheet entry:', error)
      return {
        success: false,
        message: error.message || 'Failed to create timesheet entry',
        data: null
      }
    }

    return {
      success: true,
      message: 'Timesheet entry created successfully',
      data
    }
  } catch (error) {
    console.error('Error in createTimesheetEntry:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: null
    }
  }
}

// Update a timesheet entry
export async function updateTimesheetEntry(
  entryId: string,
  userId: string,
  entryData: {
    project_id?: string
    date?: string
    hours_worked?: number
    description?: string
    task_category?: string
    billable?: boolean
  }
): Promise<TimesheetResponse> {
  try {
    const { data, error } = await supabase
      .from('timesheet_entries')
      .update(entryData)
      .eq('id', entryId)
      .eq('user_id', userId)
      .eq('status', 'draft') // Only allow updates to draft entries
      .select()
      .single()

    if (error) {
      console.error('Error updating timesheet entry:', error)
      return {
        success: false,
        message: error.message || 'Failed to update timesheet entry',
        data: null
      }
    }

    return {
      success: true,
      message: 'Timesheet entry updated successfully',
      data
    }
  } catch (error) {
    console.error('Error in updateTimesheetEntry:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: null
    }
  }
}

// Delete a timesheet entry
export async function deleteTimesheetEntry(entryId: string, userId: string): Promise<TimesheetResponse> {
  try {
    const { error } = await supabase
      .from('timesheet_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId)
      .eq('status', 'draft') // Only allow deletion of draft entries

    if (error) {
      console.error('Error deleting timesheet entry:', error)
      return {
        success: false,
        message: error.message || 'Failed to delete timesheet entry',
        data: null
      }
    }

    return {
      success: true,
      message: 'Timesheet entry deleted successfully',
      data: null
    }
  } catch (error) {
    console.error('Error in deleteTimesheetEntry:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: null
    }
  }
}

// Get timesheet entries for a user
export async function getTimesheetEntries(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<TimesheetEntry[]> {
  try {
    let query = supabase
      .from('timesheet_entries')
      .select(`
        *,
        projects (
          id,
          name,
          description,
          status,
          priority
        )
      `)
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
      console.error('Error fetching timesheet entries:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getTimesheetEntries:', error)
    return []
  }
}

// Get timesheet summary for a user
export async function getTimesheetSummary(
  userId: string,
  startDate: string,
  endDate: string
): Promise<TimesheetSummary[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_timesheet_summary', {
        user_uuid: userId,
        start_date: startDate,
        end_date: endDate
      })

    if (error) {
      console.error('Error fetching timesheet summary:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getTimesheetSummary:', error)
    return []
  }
}

// Submit timesheet for approval
export async function submitTimesheet(
  userId: string,
  weekStartDate: string,
  notes?: string
): Promise<TimesheetResponse> {
  try {
    const { data, error } = await supabase
      .rpc('submit_timesheet', {
        user_uuid: userId,
        week_start: weekStartDate,
        notes_text: notes || null
      })
      .single()

    if (error) {
      console.error('Error submitting timesheet:', error)
      return {
        success: false,
        message: error.message || 'Failed to submit timesheet',
        data: null
      }
    }

    return data
  } catch (error) {
    console.error('Error in submitTimesheet:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: null
    }
  }
}

// Get timesheet submissions for a user
export async function getTimesheetSubmissions(userId: string): Promise<TimesheetSubmission[]> {
  try {
    const { data, error } = await supabase
      .from('timesheet_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('week_start_date', { ascending: false })

    if (error) {
      console.error('Error fetching timesheet submissions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getTimesheetSubmissions:', error)
    return []
  }
}

// Approve timesheet (for managers)
export async function approveTimesheet(
  submissionId: string,
  approverId: string
): Promise<TimesheetResponse> {
  try {
    const { data, error } = await supabase
      .rpc('approve_timesheet', {
        submission_id: submissionId,
        approver_uuid: approverId
      })
      .single()

    if (error) {
      console.error('Error approving timesheet:', error)
      return {
        success: false,
        message: error.message || 'Failed to approve timesheet',
        data: null
      }
    }

    return data
  } catch (error) {
    console.error('Error in approveTimesheet:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: null
    }
  }
}

// Get current week's timesheet entries
export async function getCurrentWeekTimesheet(userId: string): Promise<TimesheetEntry[]> {
  try {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const startDate = startOfWeek.toISOString().split('T')[0]
    const endDate = endOfWeek.toISOString().split('T')[0]

    return await getTimesheetEntries(userId, startDate, endDate)
  } catch (error) {
    console.error('Error in getCurrentWeekTimesheet:', error)
    return []
  }
}

// Get total hours for current week
export async function getCurrentWeekTotalHours(userId: string): Promise<number> {
  try {
    const entries = await getCurrentWeekTimesheet(userId)
    return entries.reduce((total, entry) => total + entry.hours_worked, 0)
  } catch (error) {
    console.error('Error in getCurrentWeekTotalHours:', error)
    return 0
  }
}

// Check if user has submitted timesheet for current week
export async function hasSubmittedCurrentWeek(userId: string): Promise<boolean> {
  try {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const startDate = startOfWeek.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('timesheet_submissions')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start_date', startDate)
      .eq('status', 'submitted')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking timesheet submission:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error in hasSubmittedCurrentWeek:', error)
    return false
  }
}
