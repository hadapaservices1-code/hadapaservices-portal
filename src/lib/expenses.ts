import { createClient } from './supabase-client'
import type { Expense, ExpenseCategory, ExpenseComment } from './database.types'

// Re-export types for convenience
export type { Expense, ExpenseCategory, ExpenseComment }

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

export interface ExpenseStats {
  totalExpenses: number
  pendingExpenses: number
  approvedExpenses: number
  rejectedExpenses: number
  totalAmount: number
  pendingAmount: number
  approvedAmount: number
  rejectedAmount: number
}

export interface ManagerExpenseStats {
  totalTeamExpenses: number
  pendingTeamExpenses: number
  approvedTeamExpenses: number
  rejectedTeamExpenses: number
  totalTeamAmount: number
  pendingTeamAmount: number
  approvedTeamAmount: number
  rejectedTeamAmount: number
}

// Get all expense categories
export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching expense categories:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getExpenseCategories:', error)
    return []
  }
}

// Get employee's expenses
export async function getEmployeeExpenses(employeeId: string): Promise<Expense[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        expense_categories (
          id,
          name,
          description,
          max_amount,
          requires_receipt
        )
      `)
      .eq('employee_id', employeeId)
      .order('expense_date', { ascending: false })

    if (error) {
      console.error('Error fetching employee expenses:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getEmployeeExpenses:', error)
    return []
  }
}

// Get manager's team expenses
export async function getManagerTeamExpenses(managerId: string): Promise<Expense[]> {
  try {
    const supabase = createClient()
    
    // First, get the team member IDs
    const { data: teamMembers, error: teamError } = await supabase
      .from('profiles')
      .select('id')
      .eq('manager_id', managerId)

    if (teamError) {
      console.error('Error fetching team members:', teamError)
      return []
    }

    const teamMemberIds = teamMembers?.map(member => member.id) || []
    const allEmployeeIds = [managerId, ...teamMemberIds]

    // Now get expenses for all team members
    const { data, error } = await supabase
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
      .in('employee_id', allEmployeeIds)
      .order('expense_date', { ascending: false })

    if (error) {
      console.error('Error fetching manager team expenses:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getManagerTeamExpenses:', error)
    return []
  }
}

// Get expense statistics for employee
export async function getEmployeeExpenseStats(employeeId: string): Promise<ExpenseStats | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('expenses')
      .select('status, amount')
      .eq('employee_id', employeeId)

    if (error) {
      console.error('Error fetching employee expense stats:', error)
      return null
    }

    const stats: ExpenseStats = {
      totalExpenses: 0,
      pendingExpenses: 0,
      approvedExpenses: 0,
      rejectedExpenses: 0,
      totalAmount: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      rejectedAmount: 0
    }

    data?.forEach(expense => {
      stats.totalExpenses++
      stats.totalAmount += expense.amount

      switch (expense.status) {
        case 'pending':
          stats.pendingExpenses++
          stats.pendingAmount += expense.amount
          break
        case 'approved':
          stats.approvedExpenses++
          stats.approvedAmount += expense.amount
          break
        case 'rejected':
          stats.rejectedExpenses++
          stats.rejectedAmount += expense.amount
          break
      }
    })

    return stats
  } catch (error) {
    console.error('Error in getEmployeeExpenseStats:', error)
    return null
  }
}

// Get expense statistics for manager's team
export async function getManagerExpenseStats(managerId: string): Promise<ManagerExpenseStats | null> {
  try {
    const supabase = createClient()
    
    // First, get the team member IDs
    const { data: teamMembers, error: teamError } = await supabase
      .from('profiles')
      .select('id')
      .eq('manager_id', managerId)

    if (teamError) {
      console.error('Error fetching team members:', teamError)
      return null
    }

    const teamMemberIds = teamMembers?.map(member => member.id) || []
    const allEmployeeIds = [managerId, ...teamMemberIds]

    // Now get expenses for all team members
    const { data, error } = await supabase
      .from('expenses')
      .select('status, amount')
      .in('employee_id', allEmployeeIds)

    if (error) {
      console.error('Error fetching manager expense stats:', error)
      return null
    }

    const stats: ManagerExpenseStats = {
      totalTeamExpenses: 0,
      pendingTeamExpenses: 0,
      approvedTeamExpenses: 0,
      rejectedTeamExpenses: 0,
      totalTeamAmount: 0,
      pendingTeamAmount: 0,
      approvedTeamAmount: 0,
      rejectedTeamAmount: 0
    }

    data?.forEach(expense => {
      stats.totalTeamExpenses++
      stats.totalTeamAmount += expense.amount

      switch (expense.status) {
        case 'pending':
          stats.pendingTeamExpenses++
          stats.pendingTeamAmount += expense.amount
          break
        case 'approved':
          stats.approvedTeamExpenses++
          stats.approvedTeamAmount += expense.amount
          break
        case 'rejected':
          stats.rejectedTeamExpenses++
          stats.rejectedTeamAmount += expense.amount
          break
      }
    })

    return stats
  } catch (error) {
    console.error('Error in getManagerExpenseStats:', error)
    return null
  }
}

// Create a new expense
export async function createExpense(
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
    const supabase = createClient()
    
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
    console.error('Error in createExpense:', error)
    return {
      success: false,
      message: 'An unexpected error occurred'
    }
  }
}

// Update expense status (for managers)
export async function updateExpenseStatus(
  expenseId: string,
  managerId: string,
  status: 'approved' | 'rejected',
  comment?: string
): Promise<ApiResponse<Expense>> {
  try {
    const supabase = createClient()
    
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
    console.error('Error in updateExpenseStatus:', error)
    return {
      success: false,
      message: 'An unexpected error occurred'
    }
  }
}

// Add comment to expense
export async function addExpenseComment(
  expenseId: string,
  userId: string,
  comment: string,
  isInternal: boolean = false
): Promise<ApiResponse<ExpenseComment>> {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, message: 'User not authenticated' }
    }

    if (user.id !== userId) {
      return { success: false, message: 'User ID mismatch' }
    }

    const { data, error } = await supabase
      .from('expense_comments')
      .insert({
        expense_id: expenseId,
        user_id: userId,
        comment,
        is_internal: isInternal
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding expense comment:', error)
      return {
        success: false,
        message: error.message || 'Failed to add comment'
      }
    }

    return {
      success: true,
      message: 'Comment added successfully',
      data
    }
  } catch (error) {
    console.error('Error in addExpenseComment:', error)
    return {
      success: false,
      message: 'An unexpected error occurred'
    }
  }
}

// Get expense comments
export async function getExpenseComments(expenseId: string): Promise<ExpenseComment[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('expense_comments')
      .select(`
        *,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('expense_id', expenseId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching expense comments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getExpenseComments:', error)
    return []
  }
}

