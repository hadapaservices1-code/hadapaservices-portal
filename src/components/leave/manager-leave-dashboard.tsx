'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Users, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ManagerLeaveApproval } from './manager-leave-approval'
import { ManagerLeaveHistory } from './manager-leave-history'
import { getManagerPendingRequests, getLeaveStatistics, type LeaveRequestWithDetails, type LeaveStats } from '@/lib/leave'

interface ManagerLeaveDashboardProps {
  managerId: string
  userName: string
}

export function ManagerLeaveDashboard({ managerId, userName: _userName }: ManagerLeaveDashboardProps) {
  const [pendingRequests, setPendingRequests] = useState<LeaveRequestWithDetails[]>([])
  const [_stats, setStats] = useState<LeaveStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [requestsData, statsData] = await Promise.all([
        getManagerPendingRequests(managerId),
        getLeaveStatistics(managerId) // This would need to be modified to get team stats
      ])
      setPendingRequests(requestsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching manager leave data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [managerId])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshKey])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Leave Management</h1>
        <p className="text-sm text-gray-600">Manage and approve leave requests from your team</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-amber-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Pending Requests</p>
                <p className="text-lg font-bold text-gray-900">
                  {isLoading ? '...' : pendingRequests.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Approved Today</p>
                <p className="text-lg font-bold text-gray-900">
                  {isLoading ? '...' : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-slate-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Team Members</p>
                <p className="text-lg font-bold text-gray-900">
                  {isLoading ? '...' : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-slate-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">This Month</p>
                <p className="text-lg font-bold text-gray-900">
                  {isLoading ? '...' : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="ml-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Team History
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests Tab */}
        <TabsContent value="pending">
          <ManagerLeaveApproval 
            managerId={managerId} 
            onRefresh={handleRefresh}
            key={`approval-${refreshKey}`}
          />
        </TabsContent>

        {/* Team History Tab */}
        <TabsContent value="history">
          <ManagerLeaveHistory 
            managerId={managerId} 
            onRefresh={handleRefresh}
            key={`history-${refreshKey}`}
          />
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest leave request activity</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{request.employee_name}</p>
                          <p className="text-sm text-gray-600">{request.leave_type_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {new Date(request.applied_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-yellow-600">Pending</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">Review Pending Requests</p>
                      <p className="text-sm text-gray-600">
                        {pendingRequests.length} requests waiting for approval
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Team Leave Calendar</p>
                      <p className="text-sm text-gray-600">View team leave schedule</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Leave Analytics</p>
                      <p className="text-sm text-gray-600">View team leave patterns</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
