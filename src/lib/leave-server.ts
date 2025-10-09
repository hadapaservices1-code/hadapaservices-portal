import { createClient } from './supabase-server'
import type { LeaveRequest } from './database.types'

// Server-side version of createLeaveRequest (for use in server components and API routes)
export async function createLeaveRequestServer(
  employeeId: string,
  leaveTypeId: string,
  startDate: string,
  endDate: string,
  reason: string
): Promise<{ success: boolean; message: string; data?: LeaveRequest }> {
  try {
    // Validate input parameters
    if (!employeeId || !leaveTypeId || !startDate || !endDate || !reason) {
      return { 
        success: false, 
        message: 'Missing required parameters for leave request' 
      }
    }

    // Calculate total days
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { 
        success: false, 
        message: 'Invalid date format provided' 
      }
    }
    
    if (end < start) {
      return { 
        success: false, 
        message: 'End date must be after start date' 
      }
    }
    
    const timeDiff = end.getTime() - start.getTime()
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1

    // Create server-side Supabase client
    const supabaseServer = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    if (authError || !user) {
      console.error('Server authentication error:', authError)
      return { 
        success: false, 
        message: 'You must be logged in to create a leave request. Please refresh the page and try again.' 
      }
    }

    // Verify the employeeId matches the authenticated user
    if (user.id !== employeeId) {
      console.error('Server user ID mismatch:', { userId: user.id, employeeId })
      return { 
        success: false, 
        message: 'Authentication error. Please refresh the page and try again.' 
      }
    }

    // Check if leave_requests table exists first
    const { error: testError } = await supabaseServer
      .from('leave_requests')
      .select('id')
      .limit(1)

    if (testError && testError.code === 'PGRST116') {
      return { 
        success: false, 
        message: 'Leave management system is not set up. Please contact your administrator.' 
      }
    }

    // Get employee's manager
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('manager_id')
      .eq('id', employeeId)
      .single()

    if (profileError) {
      console.error('Error fetching employee profile:', profileError)
      return { 
        success: false, 
        message: 'Unable to find employee profile. Please try again.' 
      }
    }

    // Verify leave type exists
    const { data: leaveType, error: leaveTypeError } = await supabaseServer
      .from('leave_types')
      .select('id, name, is_active')
      .eq('id', leaveTypeId)
      .single()

    if (leaveTypeError || !leaveType) {
      console.error('Error fetching leave type:', leaveTypeError)
      return { 
        success: false, 
        message: 'Invalid leave type selected. Please refresh and try again.' 
      }
    }

    if (!leaveType.is_active) {
      return { 
        success: false, 
        message: 'Selected leave type is no longer available.' 
      }
    }

    // Create the leave request
    const { data, error } = await supabaseServer
      .from('leave_requests')
      .insert({
        employee_id: employeeId,
        manager_id: profile?.manager_id || null,
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        reason: reason,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Server error creating leave request:', {
        error,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        employeeId,
        leaveTypeId,
        startDate,
        endDate,
        userId: user.id
      })
      
      // Provide more specific error messages based on error codes
      let errorMessage = 'Failed to create leave request'
      if (error.code === '23503') {
        errorMessage = 'Invalid leave type or employee reference'
      } else if (error.code === '23505') {
        errorMessage = 'A leave request already exists for this period'
      } else if (error.code === '42501') {
        errorMessage = 'Permission denied. Please contact your administrator.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return { success: false, message: errorMessage }
    }

    if (!data) {
      return { 
        success: false, 
        message: 'Leave request was not created. Please try again.' 
      }
    }

    return { success: true, message: 'Leave request created successfully', data }
  } catch (error) {
    console.error('Unexpected server error in createLeaveRequest:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      employeeId,
      leaveTypeId,
      startDate,
      endDate
    })
    return { 
      success: false, 
      message: 'An unexpected error occurred. Please try again or contact support.' 
    }
  }
}
