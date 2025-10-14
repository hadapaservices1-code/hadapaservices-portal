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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          Leave Balance
        </CardTitle>
        <CardDescription className="text-sm">
          Your current leave balance for {year || new Date().getFullYear()}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Summary Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center p-2 bg-emerald-50 rounded-lg">
                <div className="text-lg font-bold text-emerald-600">
                  {stats.approved_requests}
                </div>
                <div className="text-xs text-emerald-700">Approved</div>
              </div>
              <div className="text-center p-2 bg-amber-50 rounded-lg">
                <div className="text-lg font-bold text-amber-600">
                  {stats.pending_requests}
                </div>
                <div className="text-xs text-amber-700">Pending</div>
              </div>
            </div>
          )}

          {/* Leave Balances */}
          {balances.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No leave balance data available</p>
              <p className="text-xs text-gray-400">
                Contact HR to set up your leave entitlements
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {balances.map((balance) => (
                <div key={balance.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{(balance as Record<string, unknown>).leave_types?.name || 'Leave Type'}</h3>
                    <Badge variant="outline" className="text-xs">
                      {balance.remaining_days} remaining
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Total Days</span>
                      <span>{balance.total_days}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Used Days</span>
                      <span>{balance.used_days}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-slate-600 h-1.5 rounded-full transition-all duration-300"
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
            <div className="mt-4 pt-3 border-t">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-slate-500" />
                  <span className="text-gray-600">Days Taken:</span>
                  <span className="font-medium">{stats.total_days_taken}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-500" />
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
