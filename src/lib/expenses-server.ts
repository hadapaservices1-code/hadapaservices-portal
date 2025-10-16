import { createClient as createServerClient } from './supabase-server'
import type { Expense } from './database.types'

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

// Server-side functions for API routes
export async function createExpenseServer(
  employeeId: string,
  expenseData: {
    categoryId: string
    title: string
    description: string
    amount: number
    currency: string
    expenseDate: string
    receiptUrl?: string
  }
): Promise<ApiResponse<Expense>> {
  try {
    const supabase = await createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, message: 'User not authenticated' }
    }

    if (user.id !== employeeId) {
      return { success: false, message: 'User ID mismatch' }
    }

    // Validate expense date
    const expenseDate = new Date(expenseData.expenseDate)
    if (isNaN(expenseDate.getTime())) {
      return { success: false, message: 'Invalid expense date' }
    }

    // Check if expense date is not in the future
    if (expenseDate > new Date()) {
      return { success: false, message: 'Expense date cannot be in the future' }
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        employee_id: employeeId,
        category_id: expenseData.categoryId,
        title: expenseData.title,
        description: expenseData.description,
        amount: expenseData.amount,
        currency: expenseData.currency,
        expense_date: expenseData.expenseDate,
        receipt_url: expenseData.receiptUrl || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating expense:', error)
      return {
        success: false,
        message: error.message || 'Failed to create expense'
      }
    }

    return {
      success: true,
      message: 'Expense created successfully',
      data
    }
  } catch (error) {
    console.error('Error in createExpenseServer:', error)
    return {
      success: false,
      message: 'An unexpected error occurred'
    }
  }
}

export async function updateExpenseStatusServer(
  expenseId: string,
  managerId: string,
  status: 'approved' | 'rejected',
  comment?: string
): Promise<ApiResponse<Expense>> {
  try {
    const supabase = await createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, message: 'User not authenticated' }
    }

    if (user.id !== managerId) {
      return { success: false, message: 'User ID mismatch' }
    }

    const { data, error } = await supabase
      .from('expenses')
      .update({
        status,
        manager_id: managerId,
        manager_comment: comment || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', expenseId)
      .select()
      .single()

    if (error) {
      console.error('Error updating expense status:', error)
      return {
        success: false,
        message: error.message || 'Failed to update expense status'
      }
    }

    return {
      success: true,
      message: `Expense ${status} successfully`,
      data
    }
  } catch (error) {
    console.error('Error in updateExpenseStatusServer:', error)
    return {
      success: false,
      message: 'An unexpected error occurred'
    }
  }
}
