import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { EmployeeLeavePortal } from '@/components/leave/employee-leave-portal'
import { ManagerLeaveDashboard } from '@/components/leave/manager-leave-dashboard'
import { BackButton } from '@/components/ui/back-button'

export default async function LeavePage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 border-b border-gray-200 bg-white">
        <BackButton />
      </div>
      <div className="container mx-auto py-6">
        {profile.role === 'employee' ? (
          <EmployeeLeavePortal 
            employeeId={user.id}
            userName={profile.full_name || 'User'}
          />
        ) : (
          <ManagerLeaveDashboard 
            managerId={user.id}
            userName={profile.full_name || 'User'}
          />
        )}
      </div>
    </div>
  )
}
