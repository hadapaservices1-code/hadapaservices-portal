import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { expenseSubmissionSchema } from '@/lib/validations'
import { createExpenseServer } from '@/lib/expenses-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, categoryId, title, description, amount, currency, expenseDate, receiptUrl } = body

    // Validate required fields
    if (!employeeId || !categoryId || !title || !description || !amount || !expenseDate) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate data using Zod schema
    const validationResult = expenseSubmissionSchema.safeParse({
      categoryId,
      title,
      description,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      expenseDate,
      receiptUrl: receiptUrl || ''
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
        { success: false, message: 'You must be logged in to create an expense. Please refresh the page and try again.' },
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

    // Use the server function to create the expense
    const result = await createExpenseServer(employeeId, {
      categoryId,
      title,
      description,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      expenseDate,
      receiptUrl: receiptUrl || undefined
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, message: result.message, data: result.data },
      { status: 201 }
    )
  } catch (error) {
    console.error('API error creating expense:', {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const managerId = searchParams.get('managerId')

    if (!employeeId && !managerId) {
      return NextResponse.json(
        { success: false, message: 'Missing employeeId or managerId parameter' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'You must be logged in to view expenses.' },
        { status: 401 }
      )
    }

    let query = supabase
      .from('expenses')
      .select(`
        *,
        expense_categories (
          id,
          name,
          description,
          max_amount,
          requires_receipt
        ),
        profiles!expenses_employee_id_fkey (
          id,
          full_name,
          email,
          department
        )
      `)

    if (managerId) {
      // Verify the managerId matches the authenticated user
      if (user.id !== managerId) {
        return NextResponse.json(
          { success: false, message: 'Authentication error. You can only view your own team expenses.' },
          { status: 403 }
        )
      }

      // Get team expenses (manager's own expenses + team member expenses)
      query = query.or(`employee_id.eq.${managerId},employee_id.in.(
        SELECT id FROM profiles WHERE manager_id = '${managerId}'
      )`)
    } else {
      // Verify the employeeId matches the authenticated user
      if (user.id !== employeeId) {
        return NextResponse.json(
          { success: false, message: 'Authentication error. You can only view your own expenses.' },
          { status: 403 }
        )
      }

      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query.order('expense_date', { ascending: false })

    if (error) {
      console.error('Error fetching expenses:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch expenses' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data: data || [] },
      { status: 200 }
    )
  } catch (error) {
    console.error('API error fetching expenses:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
