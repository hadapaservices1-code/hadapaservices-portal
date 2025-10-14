import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TasksPage } from "@/components/dashboard/tasks-page"
import { BackButton } from "@/components/ui/back-button"

export default async function TasksPageRoute() {
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
        <div className="p-4 border-b border-gray-200 bg-white">
          <BackButton />
        </div>
        <main className="p-6">
          <TasksPage 
            userId={user.id}
            userRole={profile.role}
          />
        </main>
      </div>
    </div>
  )
}

