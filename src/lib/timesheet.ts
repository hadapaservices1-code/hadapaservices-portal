import { createClient } from './supabase-client'
import { TimesheetEntry, TimesheetSubmission } from './database.types'
import { type Project } from './projects'

// Re-export types for use in components
export type { TimesheetEntry, TimesheetSubmission }
export type { Project }

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
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    
    // Get all projects with planning or in_progress status
    const { data: allProjects, error: allError } = await supabase
      .from('projects')
      .select('*')
      .in('status', ['planning', 'in_progress'])
      .order('priority', { ascending: false })
      .order('name', { ascending: true })
    
    if (allError) {
      console.error('Error fetching projects:', allError)
      return []
    }

    // Apply lenient filtering - include projects that are:
    // 1. Currently active (started and not ended), OR
    // 2. Recently created (within last 90 days), OR
    // 3. Have no start/end dates (always available)
    const activeProjects = allProjects?.filter(project => {
      const isStarted = !project.start_date || project.start_date <= today
      const isNotEnded = !project.end_date || project.end_date >= today
      const isActive = isStarted && isNotEnded
      
      // Include projects created in the last 90 days even if they have future start dates
      const createdDate = new Date(project.created_at)
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      const isRecentlyCreated = createdDate >= ninetyDaysAgo
      
      // Include projects with no start/end dates (always available)
      const hasNoDates = !project.start_date && !project.end_date
      
      return isActive || isRecentlyCreated || hasNoDates
    }) || []
    
    return activeProjects
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
  }
): Promise<TimesheetResponse> {
  console.log('=== createTimesheetEntry called ===')
  console.log('Function parameters:', { userId, entryData })
  
  // Validate input parameters
  if (!userId || typeof userId !== 'string') {
    console.error('Invalid userId:', userId)
    return { success: false, message: 'Invalid user ID', data: null }
  }
  
  if (!entryData || typeof entryData !== 'object') {
    console.error('Invalid entryData:', entryData)
    return { success: false, message: 'Invalid entry data', data: null }
  }
  
  if (!entryData.project_id || !entryData.date || !entryData.description) {
    console.error('Missing required fields:', entryData)
    return { success: false, message: 'Missing required fields', data: null }
  }
  
  try {
    console.log('Creating timesheet entry with data:', {
      userId,
      entryData,
      timestamp: new Date().toISOString()
    })

    const supabase = createClient()
    console.log('Supabase client created:', !!supabase)
    
    // Check authentication status
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Authentication check:', { 
      user: user?.id, 
      userEmail: user?.email,
      authError: authError ? {
        message: authError.message,
        status: authError.status,
        name: authError.name
      } : null
    })
    
    if (authError || !user) {
      console.error('User not authenticated:', authError)
      return { success: false, message: 'User not authenticated. Please log in again.', data: null }
    }

    if (user.id !== userId) {
      console.error('User ID mismatch:', { authenticatedUserId: user.id, providedUserId: userId })
      return { success: false, message: 'User ID mismatch. Please refresh and try again.', data: null }
    }
    
    // Test Supabase connection first
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (connectionError) {
      console.error('Supabase connection test failed:', connectionError)
      return { success: false, message: `Database connection failed: ${connectionError.message}`, data: null }
    }

    console.log('Supabase connection test passed')

    // Check if timesheet_entries table exists and is accessible
    const { data: tableTest, error: tableError } = await supabase
      .from('timesheet_entries')
      .select('id')
      .limit(1)

    if (tableError) {
      console.error('Timesheet entries table not accessible:', {
        error: tableError,
        message: tableError.message,
        details: tableError.details,
        hint: tableError.hint,
        code: tableError.code
      })
      return { 
        success: false, 
        message: `Database table not accessible: ${tableError.message}`, 
        data: null 
      }
    }

    console.log('Timesheet entries table accessible')

    // Check if project exists and user has access to it
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', entryData.project_id)
      .single()

    if (projectError) {
      console.error('Project not found or access denied:', {
        error: projectError,
        message: projectError.message,
        details: projectError.details,
        hint: projectError.hint,
        code: projectError.code
      })
      return { 
        success: false, 
        message: `Project not found or access denied: ${projectError.message || 'Project does not exist'}`, 
        data: null 
      }
    }

    if (!project) {
      console.error('Project not found: project is null or undefined')
      return { 
        success: false, 
        message: 'Project not found or access denied', 
        data: null 
      }
    }

    console.log('Project access verified:', project)

    // Check if an entry already exists for this user, project, and date (prevent duplicate)
    const { data: existingEntry, error: checkError } = await supabase
      .from('timesheet_entries')
      .select('id, status, hours_worked, description')
      .eq('user_id', userId)
      .eq('project_id', entryData.project_id)
      .eq('date', entryData.date)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing entry:', checkError)
      return {
        success: false,
        message: 'Failed to verify existing entries. Please try again.',
        data: null
      }
    }

    // If entry exists, return a user-friendly message instead of attempting insert
    if (existingEntry) {
      const entryStatus = existingEntry.status || 'unknown'
      const entryHours = existingEntry.hours_worked || 0
      return {
        success: false,
        message: `An entry already exists for this project on ${entryData.date} (${entryHours} hours, status: ${entryStatus}). Please use a different date or update the existing entry.`,
        data: null
      }
    }

    const insertData = {
        user_id: userId,
        project_id: entryData.project_id,
        date: entryData.date,
        hours_worked: entryData.hours_worked,
        description: entryData.description,
    }

    console.log('Inserting timesheet entry:', insertData)

    const { data, error } = await supabase
      .from('timesheet_entries')
      .insert(insertData)
      .select()
      .single()

    console.log('Supabase insert result:', { data, error: error ? 'Error occurred' : 'Success' })

    if (error) {
      // Extract error details - use multiple methods to capture all properties
      // Supabase errors can have getters and non-enumerable properties
      const extractErrorDetails = (err: any): Record<string, any> => {
        const details: Record<string, any> = {}
        
        // Extract known properties
        if (err !== null && typeof err === 'object') {
          // Try direct property access
          const knownProps = ['message', 'details', 'hint', 'code', 'statusCode', 'status', 'name']
          knownProps.forEach(prop => {
            try {
              const value = err[prop]
              if (value !== undefined && value !== null) {
                details[prop] = value
              }
            } catch (e) {
              // Property might not be accessible
            }
          })
          
          // Try to get all enumerable keys
          try {
            Object.keys(err).forEach(key => {
              if (!details[key]) {
                details[key] = err[key]
              }
            })
          } catch (e) {
            // Might fail for certain error types
          }
          
          // Try JSON.stringify with replacer for getters
          try {
            const jsonStr = JSON.stringify(err, (key, value) => {
              if (key === 'stack' || key === 'stackTrace') return undefined
              return value
            }, 2)
            if (jsonStr !== '{}' && jsonStr !== 'null') {
              details._json = JSON.parse(jsonStr)
            }
          } catch (e) {
            // JSON.stringify might fail
          }
          
          // Fallback: try toString
          try {
            details._toString = err.toString()
          } catch (e) {
            // toString might fail
          }
        }
        
        return details
      }
      
      const errorDetails = extractErrorDetails(error)
      
      // Log error with multiple formats for debugging
      console.error('Error creating timesheet entry - Details:', errorDetails)
      console.error('Error creating timesheet entry - Raw:', error)
      console.error('Error creating timesheet entry - String:', String(error))
      console.error('Error creating timesheet entry - Code:', error?.code)
      console.error('Error creating timesheet entry - Message:', error?.message)
      console.error('Error creating timesheet entry - Details property:', error?.details)
      
      // Determine the most helpful error message
      let errorMessage = 'Failed to create timesheet entry'
      
      // Check error code first (most reliable)
      if (error.code === '23505' || error.code?.includes('23505')) {
        errorMessage = 'An entry already exists for this project on this date. Please use a different date or update the existing entry.'
      } else if (error.code === '23503' || error.code?.includes('23503')) {
        errorMessage = 'Project not found or you do not have access to it.'
      } else if (error.code === '42501' || error.code?.includes('42501')) {
        errorMessage = 'Permission denied. Please ensure you have access to this project and can create timesheet entries.'
      } else if (error.message) {
        // Check message content for keywords
        const msg = String(error.message).toLowerCase()
        if (msg.includes('duplicate') || msg.includes('unique constraint') || msg.includes('already exists')) {
          errorMessage = 'An entry already exists for this project on this date. Please use a different date or update the existing entry.'
        } else if (msg.includes('foreign key') || msg.includes('project')) {
          errorMessage = 'Project not found or you do not have access to it.'
        } else if (msg.includes('permission') || msg.includes('rls') || msg.includes('denied')) {
          errorMessage = 'Permission denied. Please ensure you have access to this project and can create timesheet entries.'
        } else {
          errorMessage = error.message
        }
      } else if (errorDetails.message) {
        errorMessage = errorDetails.message
      }
      
      return {
        success: false,
        message: errorMessage,
        data: null
      }
    }

    console.log('Timesheet entry created successfully:', data)
    return { success: true, message: 'Timesheet entry added successfully!', data: data }
  } catch (error) {
    console.error('Error in createTimesheetEntry:', {
      error,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      stringified: JSON.stringify(error, null, 2)
    })
    
    let errorMessage = 'An unexpected error occurred.'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message)
    } else if (error && typeof error === 'string') {
      errorMessage = error
    }
    
    return {
      success: false,
      message: errorMessage, 
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
    const supabase = createClient()
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
    const supabase = createClient()
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
    const supabase = createClient()
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
    const supabase = createClient()
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
    const supabase = createClient()
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
    const supabase = createClient()
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
    const supabase = createClient()
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
    const supabase = createClient()
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
