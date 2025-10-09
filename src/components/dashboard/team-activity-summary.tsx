'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  getTeamMembersWithActivity, 
  type TeamMemberWithActivity 
} from '@/lib/team'
import { toast } from 'sonner'

interface TeamActivitySummaryProps {
  managerId: string
  onViewDetails?: () => void
}

export function TeamActivitySummary({ managerId, onViewDetails }: TeamActivitySummaryProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTeamData = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getTeamMembersWithActivity(managerId)
      setTeamMembers(data)
    } catch (error) {
      console.error('Error fetching team data:', error)
      toast.error('Failed to load team data')
    } finally {
      setIsLoading(false)
    }
  }, [managerId])

  useEffect(() => {
    fetchTeamData()
  }, [fetchTeamData])

  const getTotalMetrics = () => {
    return teamMembers.reduce((totals, member) => ({
      totalLeaves: totals.totalLeaves + member.activity.totalLeaves,
      pendingLeaves: totals.pendingLeaves + member.activity.pendingLeaves,
      approvedLeaves: totals.approvedLeaves + member.activity.approvedLeaves,
      totalHours: totals.totalHours + member.activity.totalHoursThisWeek,
      activeTasks: totals.activeTasks + member.activity.activeTasks,
      completedTasks: totals.completedTasks + member.activity.completedTasks
    }), {
      totalLeaves: 0,
      pendingLeaves: 0,
      approvedLeaves: 0,
      totalHours: 0,
      activeTasks: 0,
      completedTasks: 0
    })
  }

  const metrics = getTotalMetrics()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Activity
          </CardTitle>
          <CardDescription>Real-time team performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded" />
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Activity
            </CardTitle>
            <CardDescription>Real-time team performance overview</CardDescription>
          </div>
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Team Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{teamMembers.length}</div>
            <div className="text-sm text-blue-600">Team Members</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{metrics.totalHours}h</div>
            <div className="text-sm text-green-600">Hours This Week</div>
          </div>
        </div>

        {/* Leave Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Leave Requests</span>
            <span className="text-sm text-gray-500">{metrics.totalLeaves} total</span>
          </div>
          <div className="flex gap-2">
            {metrics.pendingLeaves > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800">
                {metrics.pendingLeaves} Pending
              </Badge>
            )}
            {metrics.approvedLeaves > 0 && (
              <Badge className="bg-green-100 text-green-800">
                {metrics.approvedLeaves} Approved
              </Badge>
            )}
          </div>
        </div>

        {/* Task Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tasks</span>
            <span className="text-sm text-gray-500">{metrics.activeTasks + metrics.completedTasks} total</span>
          </div>
          <div className="flex gap-2">
            {metrics.activeTasks > 0 && (
              <Badge className="bg-orange-100 text-orange-800">
                {metrics.activeTasks} Active
              </Badge>
            )}
            {metrics.completedTasks > 0 && (
              <Badge className="bg-blue-100 text-blue-800">
                {metrics.completedTasks} Completed
              </Badge>
            )}
          </div>
        </div>

        {/* Recent Team Members */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Recent Activity</div>
          <div className="space-y-1">
            {teamMembers.slice(0, 3).map((member) => (
              <div key={member.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{member.full_name}</span>
                <div className="flex items-center gap-1">
                  {member.activity.pendingLeaves > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      {member.activity.pendingLeaves}
                    </Badge>
                  )}
                  <span className="text-gray-500">{member.activity.totalHoursThisWeek}h</span>
                </div>
              </div>
            ))}
            {teamMembers.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{teamMembers.length - 3} more team members
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
