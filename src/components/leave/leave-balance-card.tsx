'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getEmployeeLeaveBalances, getLeaveStatistics, type LeaveBalance, type LeaveStats } from '@/lib/leave'

interface LeaveBalanceCardProps {
  employeeId: string
  year?: number
}

export function LeaveBalanceCard({ employeeId, year }: LeaveBalanceCardProps) {
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [stats, setStats] = useState<LeaveStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [balancesData, statsData] = await Promise.all([
        getEmployeeLeaveBalances(employeeId, year),
        getLeaveStatistics(employeeId, year)
      ])
      setBalances(balancesData)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching leave data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [employeeId, year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Balance</CardTitle>
          <CardDescription>Your current leave balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Leave Balance
        </CardTitle>
        <CardDescription>
          Your current leave balance for {year || new Date().getFullYear()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.approved_requests}
                </div>
                <div className="text-sm text-green-700">Approved</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pending_requests}
                </div>
                <div className="text-sm text-yellow-700">Pending</div>
              </div>
            </div>
          )}

          {/* Leave Balances */}
          {balances.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No leave balance data available</p>
              <p className="text-sm text-gray-400">
                Contact HR to set up your leave entitlements
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {balances.map((balance) => (
                <div key={balance.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{(balance as Record<string, unknown>).leave_types?.name || 'Leave Type'}</h3>
                    <Badge variant="outline">
                      {balance.remaining_days} remaining
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total Days</span>
                      <span>{balance.total_days}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Used Days</span>
                      <span>{balance.used_days}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${balance.total_days > 0 ? (balance.used_days / balance.total_days) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Stats */}
          {stats && (
            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-600">Days Taken:</span>
                  <span className="font-medium">{stats.total_days_taken}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span className="text-gray-600">Days Remaining:</span>
                  <span className="font-medium">{stats.total_days_remaining}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
