import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, leaveTypeId, startDate, endDate, reason } = body

    // Validate required fields
    if (!employeeId || !leaveTypeId || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Create server-side Supabase client
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json(
        { success: false, message: 'You must be logged in to create a leave request. Please refresh the page and try again.' },
        { status: 401 }
      )
    }

    // Verify the employeeId matches the authenticated user
    if (user.id !== employeeId) {
      console.error('User ID mismatch:', { userId: user.id, employeeId })
      return NextResponse.json(
        { success: false, message: 'Authentication error. Please refresh the page and try again.' },
        { status: 403 }
      )
    }

    // Calculate total days
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid date format provided' },
        { status: 400 }
      )
    }
    
    if (end < start) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      )
    }
    
    const timeDiff = end.getTime() - start.getTime()
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1

    // Check if leave_requests table exists first
    const { error: testError } = await supabase
      .from('leave_requests')
      .select('id')
      .limit(1)

    if (testError && testError.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, message: 'Leave management system is not set up. Please contact your administrator.' },
        { status: 503 }
      )
    }

    // Get employee's manager
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('manager_id')
      .eq('id', employeeId)
      .single()

    if (profileError) {
      console.error('Error fetching employee profile:', profileError)
      return NextResponse.json(
        { success: false, message: 'Unable to find employee profile. Please try again.' },
        { status: 400 }
      )
    }

    // Verify leave type exists
    const { data: leaveType, error: leaveTypeError } = await supabase
      .from('leave_types')
      .select('id, name, is_active')
      .eq('id', leaveTypeId)
      .single()

    if (leaveTypeError || !leaveType) {
      console.error('Error fetching leave type:', leaveTypeError)
      return NextResponse.json(
        { success: false, message: 'Invalid leave type selected. Please refresh and try again.' },
        { status: 400 }
      )
    }

    if (!leaveType.is_active) {
      return NextResponse.json(
        { success: false, message: 'Selected leave type is no longer available.' },
        { status: 400 }
      )
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
        errorMessage = 'Permission denied. Please contact your administrator.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Leave request was not created. Please try again.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Leave request created successfully', data },
      { status: 201 }
    )
  } catch (error) {
    console.error('API error creating leave request:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
