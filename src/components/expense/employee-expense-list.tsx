"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Receipt, 
  DollarSign, 
  Calendar, 
  Tag, 
  Eye, 
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"
import { getEmployeeExpenses, type Expense } from "@/lib/expenses"
import { toast } from "sonner"
import { format } from "date-fns"

interface EmployeeExpenseListProps {
  employeeId: string
  onRefresh?: () => void
}

export function EmployeeExpenseList({ employeeId, onRefresh }: EmployeeExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  const fetchExpenses = async () => {
    try {
      setIsLoading(true)
      const data = await getEmployeeExpenses(employeeId)
      setExpenses(data)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Failed to load expenses')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [employeeId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />
      case 'approved':
        return <CheckCircle className="h-3 w-3" />
      case 'rejected':
        return <XCircle className="h-3 w-3" />
      case 'cancelled':
        return <AlertCircle className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading expenses...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
            <p className="text-gray-500 mb-4">You haven&apos;t submitted any expenses yet.</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline">
              Submit your first expense
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Expenses</h3>
        <Button
          onClick={fetchExpenses}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Refresh"
          )}
        </Button>
      </div>

      <div className="space-y-3">
        {expenses.map((expense) => (
          <Card key={expense.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{expense.title}</h4>
                    <Badge className={getStatusColor(expense.status)}>
                      {getStatusIcon(expense.status)}
                      <span className="ml-1 capitalize">{expense.status}</span>
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {expense.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      <span>{(expense as Expense & { expense_categories?: { name: string } }).expense_categories?.name || 'Unknown Category'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">
                        {formatAmount(expense.amount, expense.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>

                  {expense.manager_comment && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Manager Comment:</p>
                      <p className="text-sm text-gray-600">{expense.manager_comment}</p>
                    </div>
                  )}

                  {expense.receipt_url && (
                    <div className="mt-2">
                      <a
                        href={expense.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        View Receipt
                      </a>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedExpense(expense)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expense Details Modal */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Expense Details
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedExpense(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Title</Label>
                  <p className="text-sm text-gray-900">{selectedExpense.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Amount</Label>
                  <p className="text-sm text-gray-900">
                    {formatAmount(selectedExpense.amount, selectedExpense.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Category</Label>
                  <p className="text-sm text-gray-900">
                    {(selectedExpense as Expense & { expense_categories?: { name: string } }).expense_categories?.name || 'Unknown Category'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Date</Label>
                  <p className="text-sm text-gray-900">
                    {format(new Date(selectedExpense.expense_date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Badge className={getStatusColor(selectedExpense.status)}>
                    {getStatusIcon(selectedExpense.status)}
                    <span className="ml-1 capitalize">{selectedExpense.status}</span>
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Submitted</Label>
                  <p className="text-sm text-gray-900">
                    {format(new Date(selectedExpense.submitted_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Description</Label>
                <p className="text-sm text-gray-900 mt-1">{selectedExpense.description}</p>
              </div>

              {selectedExpense.manager_comment && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Manager Comment</Label>
                  <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                    {selectedExpense.manager_comment}
                  </p>
                </div>
              )}

              {selectedExpense.receipt_url && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Receipt</Label>
                  <div className="mt-1">
                    <a
                      href={selectedExpense.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      View Receipt
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Helper component for Label
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`block ${className || ''}`}>{children}</label>
}
