"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Receipt, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Loader2,
  Eye
} from "lucide-react"
import { 
  getEmployeeExpenseStats, 
  getManagerExpenseStats, 
  type ExpenseStats, 
  type ManagerExpenseStats 
} from "@/lib/expenses"

interface ExpenseSummaryCardProps {
  userId: string
  userRole: 'employee' | 'manager' | 'admin'
  onViewExpenses?: () => void
}

export function ExpenseSummaryCard({ userId, userRole, onViewExpenses }: ExpenseSummaryCardProps) {
  const [stats, setStats] = useState<ExpenseStats | ManagerExpenseStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        let data
        if (userRole === 'employee') {
          data = await getEmployeeExpenseStats(userId)
        } else {
          data = await getManagerExpenseStats(userId)
        }
        setStats(data)
      } catch (error) {
        console.error('Error fetching expense stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [userId, userRole])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-sm">Loading expenses...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <Receipt className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Unable to load expense data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isManager = userRole === 'manager' || userRole === 'admin'
  const totalExpenses = isManager ? (stats as ManagerExpenseStats).totalTeamExpenses : (stats as ExpenseStats).totalExpenses
  const pendingExpenses = isManager ? (stats as ManagerExpenseStats).pendingTeamExpenses : (stats as ExpenseStats).pendingExpenses
  const approvedExpenses = isManager ? (stats as ManagerExpenseStats).approvedTeamExpenses : (stats as ExpenseStats).approvedExpenses
  const rejectedExpenses = isManager ? (stats as ManagerExpenseStats).rejectedTeamExpenses : (stats as ExpenseStats).rejectedExpenses
  const totalAmount = isManager ? (stats as ManagerExpenseStats).totalTeamAmount : (stats as ExpenseStats).totalAmount
  const pendingAmount = isManager ? (stats as ManagerExpenseStats).pendingTeamAmount : (stats as ExpenseStats).pendingAmount
  const approvedAmount = isManager ? (stats as ManagerExpenseStats).approvedTeamAmount : (stats as ExpenseStats).approvedAmount
  const rejectedAmount = isManager ? (stats as ManagerExpenseStats).rejectedTeamAmount : (stats as ExpenseStats).rejectedAmount

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">
              {isManager ? 'Team Expenses' : 'My Expenses'}
            </CardTitle>
          </div>
          {onViewExpenses && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewExpenses}
            >
              <Eye className="h-4 w-4 mr-1" />
              View All
            </Button>
          )}
        </div>
        <CardDescription>
          {isManager ? 'Overview of team expense submissions' : 'Your expense submission overview'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalExpenses}</div>
            <div className="text-sm text-gray-500">Total Expenses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatAmount(totalAmount)}</div>
            <div className="text-sm text-gray-500">Total Amount</div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor('pending')}>
                {pendingExpenses}
              </Badge>
              <span className="text-sm text-gray-600">{formatAmount(pendingAmount)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor('approved')}>
                {approvedExpenses}
              </Badge>
              <span className="text-sm text-gray-600">{formatAmount(approvedAmount)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor('rejected')}>
                {rejectedExpenses}
              </Badge>
              <span className="text-sm text-gray-600">{formatAmount(rejectedAmount)}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {isManager && pendingExpenses > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <TrendingUp className="h-4 w-4" />
              <span>{pendingExpenses} expense{pendingExpenses !== 1 ? 's' : ''} awaiting your approval</span>
            </div>
          </div>
        )}

        {!isManager && totalExpenses === 0 && (
          <div className="pt-2 border-t text-center">
            <p className="text-sm text-gray-500 mb-2">No expenses submitted yet</p>
            {onViewExpenses && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewExpenses}
                className="w-full"
              >
                Submit Your First Expense
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
