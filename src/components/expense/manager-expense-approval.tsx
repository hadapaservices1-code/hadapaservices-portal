"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Receipt, 
  DollarSign, 
  Calendar, 
  Tag, 
  User, 
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  MessageSquare
} from "lucide-react"
import { 
  getManagerTeamExpenses, 
  updateExpenseStatus, 
  addExpenseComment,
  getExpenseComments,
  type Expense,
  type ExpenseComment
} from "@/lib/expenses"
import { expenseApprovalSchema, expenseCommentSchema, type ExpenseApprovalFormData, type ExpenseCommentFormData } from "@/lib/validations"
import { toast } from "sonner"
import { SuccessToasts } from "@/components/ui/success-toast"
import { format } from "date-fns"

interface ManagerExpenseApprovalProps {
  managerId: string
  onRefresh?: () => void
}

export function ManagerExpenseApproval({ managerId, onRefresh }: ManagerExpenseApprovalProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [comments, setComments] = useState<ExpenseComment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isApproving, setIsApproving] = useState<string | null>(null)
  const [isAddingComment, setIsAddingComment] = useState(false)

  const {
    register: registerApproval,
    handleSubmit: handleApprovalSubmit,
    formState: { errors: approvalErrors },
    reset: resetApproval
  } = useForm<ExpenseApprovalFormData>({
    resolver: zodResolver(expenseApprovalSchema)
  })

  const {
    register: registerComment,
    handleSubmit: handleCommentSubmit,
    formState: { errors: commentErrors },
    reset: resetComment
  } = useForm<ExpenseCommentFormData>({
    resolver: zodResolver(expenseCommentSchema)
  })

  const fetchExpenses = async () => {
    try {
      setIsLoading(true)
      const data = await getManagerTeamExpenses(managerId)
      setExpenses(data)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Failed to load expenses')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchComments = async (expenseId: string) => {
    try {
      setIsLoadingComments(true)
      const data = await getExpenseComments(expenseId)
      setComments(data)
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setIsLoadingComments(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [managerId])

  const handleExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense)
    fetchComments(expense.id)
    resetApproval()
    resetComment()
  }

  const onApprovalSubmit = async (data: ExpenseApprovalFormData) => {
    if (!selectedExpense) return

    try {
      setIsApproving(selectedExpense.id)
      
      const result = await updateExpenseStatus(
        selectedExpense.id,
        managerId,
        data.status,
        data.comment
      )

      if (result.success) {
        if (data.status === 'approved') {
          SuccessToasts.expenseApproved()
        } else if (data.status === 'rejected') {
          SuccessToasts.expenseRejected()
        } else {
          toast.success(`Expense ${data.status} successfully`)
        }
        fetchExpenses()
        onRefresh?.()
        setSelectedExpense(null)
      } else {
        toast.error(result.message || 'Failed to update expense status')
      }
    } catch (error) {
      console.error('Error updating expense status:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsApproving(null)
    }
  }

  const onCommentSubmit = async (data: ExpenseCommentFormData) => {
    if (!selectedExpense) return

    try {
      setIsAddingComment(true)
      
      const result = await addExpenseComment(
        selectedExpense.id,
        managerId,
        data.comment,
        data.isInternal
      )

      if (result.success) {
        toast.success('Comment added successfully')
        fetchComments(selectedExpense.id)
        resetComment()
      } else {
        toast.error(result.message || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsAddingComment(false)
    }
  }

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

  const pendingExpenses = expenses.filter(expense => expense.status === 'pending')
  const processedExpenses = expenses.filter(expense => expense.status !== 'pending')

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Expense Approvals</h3>
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

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingExpenses.length})
          </TabsTrigger>
          <TabsTrigger value="processed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Processed ({processedExpenses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingExpenses.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending expenses</h3>
                <p className="text-gray-500">All team expenses have been processed.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onClick={() => handleExpenseClick(expense)}
                  formatAmount={formatAmount}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {processedExpenses.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No processed expenses</h3>
                <p className="text-gray-500">No expenses have been processed yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {processedExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onClick={() => handleExpenseClick(expense)}
                  formatAmount={formatAmount}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Expense Details Modal */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Expense Review
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
            <CardContent className="space-y-6">
              {/* Expense Details */}
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
                  <Label className="text-sm font-medium text-gray-700">Employee</Label>
                  <p className="text-sm text-gray-900">
                    {(selectedExpense as Expense & { profiles?: { full_name: string } }).profiles?.full_name || 'Unknown Employee'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Badge className={getStatusColor(selectedExpense.status)}>
                    {getStatusIcon(selectedExpense.status)}
                    <span className="ml-1 capitalize">{selectedExpense.status}</span>
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Description</Label>
                <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                  {selectedExpense.description}
                </p>
              </div>

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

              {/* Approval Form - Only for pending expenses */}
              {selectedExpense.status === 'pending' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Approve or Reject</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleApprovalSubmit(onApprovalSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="comment">Comment (Optional)</Label>
                        <Textarea
                          id="comment"
                          {...registerApproval("comment")}
                          placeholder="Add a comment for the employee..."
                          rows={3}
                          className={approvalErrors.comment ? "border-red-500" : ""}
                        />
                        {approvalErrors.comment && (
                          <p className="text-sm text-red-600 mt-1">{approvalErrors.comment.message}</p>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="submit"
                          variant="default"
                          className="flex-1"
                          disabled={isApproving === selectedExpense.id}
                          onClick={() => {
                            registerApproval("status", { value: "approved" })
                          }}
                        >
                          {isApproving === selectedExpense.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          type="submit"
                          variant="destructive"
                          className="flex-1"
                          disabled={isApproving === selectedExpense.id}
                          onClick={() => {
                            registerApproval("status", { value: "rejected" })
                          }}
                        >
                          {isApproving === selectedExpense.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Comments Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Comments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Comment Form */}
                  <form onSubmit={handleCommentSubmit(onCommentSubmit)} className="space-y-3">
                    <div>
                      <Label htmlFor="comment">Add Comment</Label>
                      <Textarea
                        id="comment"
                        {...registerComment("comment")}
                        placeholder="Add a comment..."
                        rows={2}
                        className={commentErrors.comment ? "border-red-500" : ""}
                      />
                      {commentErrors.comment && (
                        <p className="text-sm text-red-600 mt-1">{commentErrors.comment.message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isInternal"
                        {...registerComment("isInternal")}
                        className="rounded"
                      />
                      <Label htmlFor="isInternal" className="text-sm">
                        Internal comment (not visible to employee)
                      </Label>
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isAddingComment}
                    >
                      {isAddingComment ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="mr-2 h-4 w-4" />
                      )}
                      Add Comment
                    </Button>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-3">
                    {isLoadingComments ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2">Loading comments...</span>
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {(comment as ExpenseComment & { profiles?: { full_name: string } }).profiles?.full_name || 'Unknown User'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                              </span>
                              {comment.is_internal && (
                                <Badge variant="secondary" className="text-xs">
                                  Internal
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{comment.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Helper component for expense cards
function ExpenseCard({ 
  expense, 
  onClick, 
  formatAmount, 
  getStatusColor, 
  getStatusIcon 
}: {
  expense: Expense
  onClick: () => void
  formatAmount: (amount: number, currency: string) => string
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => React.ReactNode
}) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
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
                <User className="h-4 w-4" />
                <span>{(expense as Expense & { profiles?: { full_name: string } }).profiles?.full_name || 'Unknown Employee'}</span>
              </div>
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
          </div>

          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            Review
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
