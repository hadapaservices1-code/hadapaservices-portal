import { supabase, supabaseAdmin } from './supabase'
import type { LeaveType, LeaveRequest, LeaveBalance, LeaveComment } from './database.types'

// Leave Types
export interface LeaveTypeWithStats extends LeaveType {
  used_days?: number
  remaining_days?: number
}

// Leave Request with additional info
export interface LeaveRequestWithDetails {
  id: string
  employee_id: string
  manager_id: string | null
  leave_type_id: string
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  manager_comment: string | null
  applied_at: string
  reviewed_at: string | null
  created_at: string
  updated_at: string
  leave_type_name: string
  employee_name: string
  manager_name?: string
}

// Leave Statistics
export interface LeaveStats {
  total_requests: number
  approved_requests: number
  pending_requests: number
  rejected_requests: number
  total_days_taken: number
  total_days_remaining: number
}

// Get all leave types
export async function getLeaveTypes(): Promise<LeaveType[]> {
  try {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching leave types:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getLeaveTypes:', error)
    return []
  }
}

// Get employee leave requests
export async function getEmployeeLeaveRequests(employeeId: string): Promise<LeaveRequestWithDetails[]> {
  try {
    // Check if leave_requests table exists
    const { error: testError } = await supabaseAdmin
      .from('leave_requests')
      .select('id')
      .limit(1)

    if (testError && testError.code === 'PGRST116') {
      // Table doesn't exist yet, return empty array
      console.log('Leave management tables not yet created. Please run the database schema.')
      return []
    }

    // Use admin client for better reliability and real-time data access
    const { data: fallbackData, error: fallbackError } = await supabaseAdmin
      .from('leave_requests')
      .select(`
        *,
        leave_types(name),
        profiles!leave_requests_manager_id_fkey(full_name)
      `)
      .eq('employee_id', employeeId)
      .order('applied_at', { ascending: false })

    if (fallbackError) {
      console.error('Error fetching employee leave requests:', fallbackError)
      return []
    }

    return (fallbackData || []).map((request: Record<string, unknown>) => ({
      id: request.id,
      employee_id: employeeId,
      manager_id: request.manager_id,
      leave_type_id: request.leave_type_id,
      start_date: request.start_date,
      end_date: request.end_date,
      total_days: request.total_days,
      reason: request.reason,
      status: request.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
      manager_comment: request.manager_comment,
      applied_at: request.applied_at,
      reviewed_at: request.reviewed_at,
      created_at: request.created_at,
      updated_at: request.updated_at,
      leave_type_name: (request.leave_types as Record<string, unknown>)?.name || 'Unknown',
      employee_name: '',
      manager_name: (request.profiles as Record<string, unknown>)?.full_name || ''
    }))
  } catch (error) {
    console.error('Error in getEmployeeLeaveRequests:', error)
    return []
  }
}

// Get employee leave history (all statuses)
export async function getEmployeeLeaveHistory(employeeId: string): Promise<LeaveRequestWithDetails[]> {
  try {
    // Check if leave_requests table exists
    const { error: testError } = await supabaseAdmin
      .from('leave_requests')
      .select('id')
      .limit(1)

    if (testError && testError.code === 'PGRST116') {
      console.log('Leave management tables not yet created. Please run the database schema.')
      return []
    }

    // Get all leave requests for the employee
    const { data: fallbackData, error: fallbackError } = await supabaseAdmin
      .from('leave_requests')
      .select(`
        *,
        leave_types(name),
        profiles!leave_requests_manager_id_fkey(full_name)
      `)
      .eq('employee_id', employeeId)
      .order('applied_at', { ascending: false })

    if (fallbackError) {
      console.error('Error fetching employee leave history:', fallbackError)
      return []
    }

    return (fallbackData || []).map((request: Record<string, unknown>) => ({
      id: request.id,
      employee_id: employeeId,
      manager_id: request.manager_id,
      leave_type_id: request.leave_type_id,
      start_date: request.start_date,
      end_date: request.end_date,
      total_days: request.total_days,
      reason: request.reason,
      status: request.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
      manager_comment: request.manager_comment,
      applied_at: request.applied_at,
      reviewed_at: request.reviewed_at,
      created_at: request.created_at,
      updated_at: request.updated_at,
      leave_type_name: (request.leave_types as Record<string, unknown>)?.name || 'Unknown',
      employee_name: '',
      manager_name: (request.profiles as Record<string, unknown>)?.full_name || ''
    }))
  } catch (error) {
    console.error('Error in getEmployeeLeaveHistory:', error)
    return []
  }
}

// Get manager's pending leave requests (client-side)
export async function getManagerPendingRequests(managerId: string): Promise<LeaveRequestWithDetails[]> {
  try {
    // Check if leave_requests table exists by trying a simple query
    const { error: testError } = await supabase
      .from('leave_requests')
      .select('id')
      .limit(1)

    if (testError && testError.code === 'PGRST116') {
      // Table doesn't exist yet, return empty array
      console.log('Leave management tables not yet created. Please run the database schema.')
      return []
    }

    // Use direct query for better reliability
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('leave_requests')
      .select(`
        *,
        leave_types(name),
        profiles!leave_requests_employee_id_fkey(full_name, email)
      `)
      .eq('manager_id', managerId)
      .eq('status', 'pending')
      .order('applied_at', { ascending: true })

    if (fallbackError) {
      console.error('Error fetching manager pending requests:', fallbackError)
      return []
    }

    return (fallbackData || []).map((request: Record<string, unknown>) => ({
      id: request.id,
      employee_id: request.employee_id,
      manager_id: managerId,
      leave_type_id: request.leave_type_id,
      start_date: request.start_date,
      end_date: request.end_date,
      total_days: request.total_days,
      reason: request.reason,
      status: 'pending' as const,
      manager_comment: request.manager_comment,
      applied_at: request.applied_at,
      reviewed_at: request.reviewed_at,
      created_at: request.created_at,
      updated_at: request.updated_at,
      leave_type_name: (request.leave_types as Record<string, unknown>)?.name || 'Unknown',
      employee_name: (request.profiles as Record<string, unknown>)?.full_name || 'Unknown',
      manager_name: ''
    }))
  } catch (error) {
    console.error('Error in getManagerPendingRequests:', error)
    return []
  }
}

// Get manager's pending leave requests (using admin client for better reliability)
export async function getManagerPendingRequestsServer(managerId: string): Promise<LeaveRequestWithDetails[]> {
  try {
    // Check if leave_requests table exists by trying a simple query
    const { error: testError } = await supabaseAdmin
      .from('leave_requests')
      .select('id')
      .limit(1)

    if (testError && testError.code === 'PGRST116') {
      // Table doesn't exist yet, return empty array
      console.log('Leave management tables not yet created. Please run the database schema.')
      return []
    }

    // Use direct query for better reliability
    const { data: fallbackData, error: fallbackError } = await supabaseAdmin
      .from('leave_requests')
      .select(`
        *,
        leave_types(name),
        profiles!leave_requests_employee_id_fkey(full_name, email)
      `)
      .eq('manager_id', managerId)
      .eq('status', 'pending')
      .order('applied_at', { ascending: true })

    if (fallbackError) {
      console.error('Error fetching manager pending requests:', fallbackError)
      return []
    }

    return (fallbackData || []).map((request: Record<string, unknown>) => ({
      id: request.id,
      employee_id: request.employee_id,
      manager_id: managerId,
      leave_type_id: request.leave_type_id,
      start_date: request.start_date,
      end_date: request.end_date,
      total_days: request.total_days,
      reason: request.reason,
      status: 'pending' as const,
      manager_comment: request.manager_comment,
      applied_at: request.applied_at,
      reviewed_at: request.reviewed_at,
      created_at: request.created_at,
      updated_at: request.updated_at,
      leave_type_name: (request.leave_types as Record<string, unknown>)?.name || 'Unknown',
      employee_name: (request.profiles as Record<string, unknown>)?.full_name || 'Unknown',
      manager_name: ''
    }))
  } catch (error) {
    console.error('Error in getManagerPendingRequestsServer:', error)
    return []
  }
}

// Get manager's leave history (all statuses for their team)
export async function getManagerLeaveHistory(managerId: string): Promise<LeaveRequestWithDetails[]> {
  try {
    // Check if leave_requests table exists by trying a simple query
    const { error: testError } = await supabaseAdmin
      .from('leave_requests')
      .select('id')
      .limit(1)

    if (testError && testError.code === 'PGRST116') {
      console.log('Leave management tables not yet created. Please run the database schema.')
      return []
    }

    // Get all leave requests for the manager's team
    const { data: fallbackData, error: fallbackError } = await supabaseAdmin
      .from('leave_requests')
      .select(`
        *,
        leave_types(name),
        profiles!leave_requests_employee_id_fkey(full_name, email)
      `)
      .eq('manager_id', managerId)
      .order('applied_at', { ascending: false })

    if (fallbackError) {
      console.error('Error fetching manager leave history:', fallbackError)
      return []
    }

    return (fallbackData || []).map((request: Record<string, unknown>) => ({
      id: request.id,
      employee_id: request.employee_id,
      manager_id: managerId,
      leave_type_id: request.leave_type_id,
      start_date: request.start_date,
      end_date: request.end_date,
      total_days: request.total_days,
      reason: request.reason,
      status: request.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
      manager_comment: request.manager_comment,
      applied_at: request.applied_at,
      reviewed_at: request.reviewed_at,
      created_at: request.created_at,
      updated_at: request.updated_at,
      leave_type_name: (request.leave_types as Record<string, unknown>)?.name || 'Unknown',
      employee_name: (request.profiles as Record<string, unknown>)?.full_name || 'Unknown',
      manager_name: ''
    }))
  } catch (error) {
    console.error('Error in getManagerLeaveHistory:', error)
    return []
  }
}

// Approve or reject leave request
export async function updateLeaveRequestStatus(
  requestId: string,
  status: 'approved' | 'rejected',
  managerComment?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Try admin client first for better reliability
    const { error } = await supabaseAdmin
      .from('leave_requests')
      .update({
        status,
        manager_comment: managerComment || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (error) {
      console.error('Error updating leave request status:', error)
      return { success: false, message: 'Failed to update leave request status' }
    }

    return { success: true, message: `Leave request ${status} successfully` }
  } catch (error) {
    console.error('Error in updateLeaveRequestStatus:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}

// Cancel leave request (employee only)
export async function cancelLeaveRequest(requestId: string): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('leave_requests')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (error) {
      console.error('Error cancelling leave request:', error)
      return { success: false, message: 'Failed to cancel leave request' }
    }

    return { success: true, message: 'Leave request cancelled successfully' }
  } catch (error) {
    console.error('Error in cancelLeaveRequest:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}


// Get leave statistics
export async function getLeaveStatistics(employeeId: string, year?: number): Promise<LeaveStats | null> {
  try {
    const currentYear = year || new Date().getFullYear()
    
    // Check if leave_requests table exists
    const { error: testError } = await supabase
      .from('leave_requests')
      .select('id')
      .limit(1)

    if (testError && testError.code === 'PGRST116') {
      // Table doesn't exist yet, return default stats
      console.log('Leave management tables not yet created. Please run the database schema.')
      return {
        total_requests: 0,
        approved_requests: 0,
        pending_requests: 0,
        rejected_requests: 0,
        total_days_taken: 0,
        total_days_remaining: 0
      }
    }

    // Try RPC function first
    const { data, error } = await supabase
      .rpc('get_leave_statistics', { 
        emp_id: employeeId, 
        year: currentYear 
      })

    if (error) {
      console.log('RPC function not available, using direct query')
      
      // Fallback to direct queries
      const { data: requestsData, error: requestsError } = await supabase
        .from('leave_requests')
        .select('status, total_days')
        .eq('employee_id', employeeId)
        .gte('applied_at', `${currentYear}-01-01`)
        .lt('applied_at', `${currentYear + 1}-01-01`)

      if (requestsError) {
        console.error('Error fetching leave statistics:', requestsError)
        return null
      }

      const requests = requestsData || []
      const totalRequests = requests.length
      const approvedRequests = requests.filter(r => r.status === 'approved').length
      const pendingRequests = requests.filter(r => r.status === 'pending').length
      const rejectedRequests = requests.filter(r => r.status === 'rejected').length
      const totalDaysTaken = requests
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + (r.total_days || 0), 0)

      return {
        total_requests: totalRequests,
        approved_requests: approvedRequests,
        pending_requests: pendingRequests,
        rejected_requests: rejectedRequests,
        total_days_taken: totalDaysTaken,
        total_days_remaining: 0 // This would need leave_balances table
      }
    }

    const stats = data?.[0]
    if (!stats) return null

    return {
      total_requests: Number(stats.total_requests) || 0,
      approved_requests: Number(stats.approved_requests) || 0,
      pending_requests: Number(stats.pending_requests) || 0,
      rejected_requests: Number(stats.rejected_requests) || 0,
      total_days_taken: Number(stats.total_days_taken) || 0,
      total_days_remaining: Number(stats.total_days_remaining) || 0
    }
  } catch (error) {
    console.error('Error in getLeaveStatistics:', error)
    return null
  }
}

// Create leave request
export async function createLeaveRequest(
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

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return { 
        success: false, 
        message: 'You must be logged in to create a leave request. Please refresh the page and try again.' 
      }
    }

    // Verify the employeeId matches the authenticated user
    if (user.id !== employeeId) {
      console.error('User ID mismatch:', { userId: user.id, employeeId })
      return { 
        success: false, 
        message: 'Authentication error. Please refresh the page and try again.' 
      }
    }

    // Check if leave_requests table exists first
    const { error: testError } = await supabase
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
    const { data: profile, error: profileError } = await supabase
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
    const { data: leaveType, error: leaveTypeError } = await supabase
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
    const { data, error } = await supabase
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
      console.error('Error creating leave request:', {
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
        errorMessage = 'Permission denied. Please refresh the page and try again.'
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
    console.error('Unexpected error in createLeaveRequest:', {
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



// Get leave request details with comments
export async function getLeaveRequestDetails(requestId: string): Promise<{
  request: LeaveRequestWithDetails | null
  comments: LeaveComment[]
}> {
  try {
    // Get request details
    const { data: requestData, error: requestError } = await supabase
      .from('leave_requests')
      .select(`
        *,
        leave_types(name),
        profiles!leave_requests_employee_id_fkey(full_name),
        profiles!leave_requests_manager_id_fkey(full_name)
      `)
      .eq('id', requestId)
      .single()

    if (requestError) {
      console.error('Error fetching leave request details:', requestError)
      return { request: null, comments: [] }
    }

    // Get comments
    const { data: commentsData, error: commentsError } = await supabase
      .from('leave_comments')
      .select(`
        *,
        profiles(full_name)
      `)
      .eq('leave_request_id', requestId)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('Error fetching leave comments:', commentsError)
    }

    const request: LeaveRequestWithDetails = {
      ...requestData,
      leave_type_name: requestData.leave_types?.name || '',
      employee_name: requestData.profiles?.full_name || '',
      manager_name: requestData.profiles?.full_name || ''
    }

    return {
      request,
      comments: commentsData || []
    }
  } catch (error) {
    console.error('Error in getLeaveRequestDetails:', error)
    return { request: null, comments: [] }
  }
}

// Add comment to leave request
export async function addLeaveComment(
  requestId: string,
  userId: string,
  comment: string,
  isInternal: boolean = false
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from('leave_comments')
      .insert({
        leave_request_id: requestId,
        user_id: userId,
        comment,
        is_internal: isInternal
      })

    if (error) {
      console.error('Error adding leave comment:', error)
      return { success: false, message: 'Failed to add comment' }
    }

    return { success: true, message: 'Comment added successfully' }
  } catch (error) {
    console.error('Error in addLeaveComment:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}

// Get employee leave balances
export async function getEmployeeLeaveBalances(employeeId: string, year?: number): Promise<LeaveBalance[]> {
  try {
    const currentYear = year || new Date().getFullYear()
    const { data, error } = await supabase
      .from('leave_balances')
      .select(`
        *,
        leave_types(name, max_days_per_year)
      `)
      .eq('employee_id', employeeId)
      .eq('year', currentYear)

    if (error) {
      console.error('Error fetching leave balances:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getEmployeeLeaveBalances:', error)
    return []
  }
}

