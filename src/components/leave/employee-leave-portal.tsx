'use client'

import { useState } from 'react'
import { Calendar, FileText, BarChart3, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeaveRequestForm } from './leave-request-form'
import { LeaveRequestsList } from './leave-requests-list'
import { LeaveBalanceCard } from './leave-balance-card'
import { EmployeeLeaveHistory } from './employee-leave-history'

interface EmployeeLeavePortalProps {
  employeeId: string
  userName: string
}

export function EmployeeLeavePortal({ employeeId, _userName }: EmployeeLeavePortalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leave Portal</h1>
          <p className="text-sm text-gray-600">Manage your leave requests and track your balance</p>
        </div>
        <Button
          onClick={() => setActiveTab('request')}
          className="flex items-center gap-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-1 text-xs">
            <BarChart3 className="h-3 w-3" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-1 text-xs">
            <FileText className="h-3 w-3" />
            My Requests
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            History
          </TabsTrigger>
          <TabsTrigger value="request" className="flex items-center gap-1 text-xs">
            <Plus className="h-3 w-3" />
            New Request
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LeaveBalanceCard 
              employeeId={employeeId} 
              key={`balance-${refreshKey}`}
            />
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common leave management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setActiveTab('request')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Submit New Leave Request
                </Button>
                <Button
                  onClick={() => setActiveTab('requests')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View All Requests
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* My Requests Tab */}
        <TabsContent value="requests">
          <LeaveRequestsList 
            employeeId={employeeId} 
            onRefresh={handleRefresh}
            key={`requests-${refreshKey}`}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <EmployeeLeaveHistory 
            employeeId={employeeId} 
            onRefresh={handleRefresh}
            key={`history-${refreshKey}`}
          />
        </TabsContent>

        {/* New Request Tab */}
        <TabsContent value="request">
          <LeaveRequestForm 
            employeeId={employeeId} 
            onSuccess={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
