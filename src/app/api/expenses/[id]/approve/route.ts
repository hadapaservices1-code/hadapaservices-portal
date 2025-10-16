import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { expenseApprovalSchema } from '@/lib/validations'
import { updateExpenseStatusServer } from '@/lib/expenses-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { status, comment } = body
    const { id: expenseId } = await params

    // Validate required fields
    if (!expenseId || !status) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate data using Zod schema
    const validationResult = expenseApprovalSchema.safeParse({
      status,
      comment: comment || ''
    })

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.issues
        },
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
        { success: false, message: 'You must be logged in to approve expenses.' },
        { status: 401 }
      )
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user is a manager or admin
    if (!['manager', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, message: 'Only managers can approve expenses' },
        { status: 403 }
      )
    }

    // Get the expense to verify it exists and check permissions
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .select(`
        *,
        profiles!expenses_employee_id_fkey (
          id,
          manager_id
        )
      `)
      .eq('id', expenseId)
      .single()

    if (expenseError || !expense) {
      return NextResponse.json(
        { success: false, message: 'Expense not found' },
        { status: 404 }
      )
    }

    // Check if the manager can approve this expense
    // Manager can approve their own expenses or their team members' expenses
    const canApprove = 
      expense.employee_id === user.id || // Own expense
      expense.profiles?.manager_id === user.id || // Team member's expense
      profile.role === 'admin' // Admin can approve any expense

    if (!canApprove) {
      return NextResponse.json(
        { success: false, message: 'You can only approve your own expenses or your team members\' expenses' },
        { status: 403 }
      )
    }

    // Check if expense is already processed
    if (expense.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'This expense has already been processed' },
        { status: 400 }
      )
    }

    // Use the server function to update the expense status
    const result = await updateExpenseStatusServer(expenseId, user.id, status, comment)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        message: result.message, 
        data: result.data 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('API error updating expense status:', {
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
