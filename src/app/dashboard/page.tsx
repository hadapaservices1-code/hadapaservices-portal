import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard"
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/auth")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        userRole={profile.role}
        userName={profile.full_name || "User"}
        userDepartment={profile.department || undefined}
      />
      
      <div className="lg:pl-64">
        <main className="p-6">
          {profile.role === "employee" ? (
            <EmployeeDashboard 
              userName={profile.full_name || "User"}
              userDepartment={profile.department || undefined}
            />
          ) : (
            <ManagerDashboard 
              userName={profile.full_name || "User"}
              userDepartment={profile.department || undefined}
            />
          )}
        </main>
      </div>
    </div>
  )
}
