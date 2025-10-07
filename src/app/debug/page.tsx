import { createClient } from "@/lib/supabase-server"

export default async function DebugPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user ? await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single() : { data: null }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Authentication</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">User Status:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {user ? JSON.stringify(user, null, 2) : "No user found"}
          </pre>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Profile Status:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {profile ? JSON.stringify(profile, null, 2) : "No profile found"}
          </pre>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Session Status:</h2>
          <p className="text-sm text-gray-600">
            {user ? "✅ Authenticated" : "❌ Not authenticated"}
          </p>
        </div>
      </div>
    </div>
  )
}
