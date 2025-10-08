import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()

  const code = searchParams.code

  if (code && typeof code === 'string') {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get the user to create their profile
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (!existingProfile) {
          // Create profile from user metadata
          await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || "User",
              role: user.user_metadata?.role || "employee",
              department: user.user_metadata?.department || null,
              position: user.user_metadata?.position || null,
            })
        }
      }
    }
  }

  redirect("/dashboard")
}
