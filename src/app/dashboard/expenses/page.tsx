"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Receipt, Plus, FileText, CheckCircle, Clock } from "lucide-react"
import { ExpenseSubmissionForm } from "@/components/expense/expense-submission-form"
import { EmployeeExpenseList } from "@/components/expense/employee-expense-list"
import { ManagerExpenseApproval } from "@/components/expense/manager-expense-approval"
import { ExpenseSummaryCard } from "@/components/expense/expense-summary-card"
import { createClient } from "@/lib/supabase-client"
import { toast } from "sonner"

interface UserProfile {
  id: string
  full_name: string
  role: 'employee' | 'manager' | 'admin'
  department: string | null
}

export default function ExpensesPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !authUser) {
          toast.error('Please log in to access expenses')
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, role, department')
          .eq('id', authUser.id)
          .single()

        if (profileError || !profile) {
          toast.error('User profile not found')
          return
        }

        setUser(profile)
      } catch (error) {
        console.error('Error fetching user:', error)
        toast.error('Failed to load user data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleExpenseSubmitted = () => {
    setShowSubmissionForm(false)
    setActiveTab("overview")
    toast.success('Expense submitted successfully')
  }

  const handleViewExpenses = () => {
    setActiveTab(user?.role === 'employee' ? 'my-expenses' : 'team-expenses')
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading expenses...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Please log in to access the expense management system.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isManager = user.role === 'manager' || user.role === 'admin'

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Expense Management
          </h1>
          <p className="text-gray-600">
            {isManager ? 'Manage team expenses and approvals' : 'Submit and track your expenses'}
          </p>
        </div>
        {!isManager && (
          <Button
            onClick={() => setShowSubmissionForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Submit Expense
          </Button>
        )}
      </div>

      {/* Expense Submission Modal */}
      {showSubmissionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <ExpenseSubmissionForm
              employeeId={user.id}
              onExpenseSubmitted={handleExpenseSubmitted}
              onCancel={() => setShowSubmissionForm(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Overview
          </TabsTrigger>
          {isManager ? (
            <TabsTrigger value="team-expenses" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Team Expenses
            </TabsTrigger>
          ) : (
            <TabsTrigger value="my-expenses" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              My Expenses
            </TabsTrigger>
          )}
          <TabsTrigger value="submit" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Submit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseSummaryCard
              userId={user.id}
              userRole={user.role}
              onViewExpenses={handleViewExpenses}
            />
            
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>
                  Common expense management tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isManager ? (
                  <>
                    <Button
                      onClick={() => setActiveTab("team-expenses")}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Review Pending Approvals
                    </Button>
                    <Button
                      onClick={() => setActiveTab("team-expenses")}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View All Team Expenses
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => setShowSubmissionForm(true)}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Submit New Expense
                    </Button>
                    <Button
                      onClick={() => setActiveTab("my-expenses")}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      View My Expenses
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value={isManager ? "team-expenses" : "my-expenses"} className="space-y-6">
          {isManager ? (
            <ManagerExpenseApproval
              managerId={user.id}
              onRefresh={() => setActiveTab("overview")}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">My Expenses</h2>
                <Button
                  onClick={() => setShowSubmissionForm(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Submit New Expense
                </Button>
              </div>
              <EmployeeExpenseList
                employeeId={user.id}
                onRefresh={() => setActiveTab("overview")}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="submit" className="space-y-6">
          {isManager ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Manager View</h3>
                <p className="text-gray-500 mb-4">
                  As a manager, you can review and approve team expenses. Use the &quot;Team Expenses&quot; tab to manage approvals.
                </p>
                <Button
                  onClick={() => setActiveTab("team-expenses")}
                  variant="outline"
                >
                  Go to Team Expenses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ExpenseSubmissionForm
              employeeId={user.id}
              onExpenseSubmitted={handleExpenseSubmitted}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
