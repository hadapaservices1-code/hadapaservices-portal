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

    // Fetch all assigned managers for this employee
    const { data: assignedManagers, error: assignedManagersError } = await supabase
      .from('manager_employee')
      .select('manager_id')
      .eq('employee_id', employeeId)

    if (assignedManagersError) {
      console.error('Error fetching assigned managers:', assignedManagersError)
      return NextResponse.json({ success: false, message: 'Unable to fetch managers for this employee. Please try again.' }, { status: 400 })
    }

    let managerIds = assignedManagers?.map(row => row.manager_id) || []

    // Fallback to profiles.manager_id if no rows in manager_employee
    if (managerIds.length === 0) {
      const { data: profileRow, error: profileErr } = await supabase
        .from('profiles')
        .select('manager_id')
        .eq('id', employeeId)
        .single()
      if (profileErr) {
        console.error('Error fetching employee profile manager:', profileErr)
        return NextResponse.json({ success: false, message: 'Unable to determine manager for this employee.' }, { status: 400 })
      }
      if (profileRow?.manager_id) {
        managerIds = [profileRow.manager_id]
      }
    }
    
    if (managerIds.length === 0) {
      return NextResponse.json({ success: false, message: 'No assigned manager found for this employee.' }, { status: 400 })
    }
    
    // Insert leave requests for all managers (or adjust schema to support many managers per request)
    let leaveData: any[] = []
    for (const managerId of managerIds) {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: employeeId,
          manager_id: managerId,
          leave_type_id: leaveTypeId,
          start_date: startDate,
          end_date: endDate,
          total_days: totalDays,
          reason: reason,
          status: 'pending'
        })
        .select()
        .single();
      if (error) {
        console.error('Error creating leave request:', error);
        continue;
      }
      leaveData.push(data);
    }
    if (leaveData.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Leave request was not created. Please try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Leave request created successfully', data: leaveData },
      { status: 201 }
    );
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
