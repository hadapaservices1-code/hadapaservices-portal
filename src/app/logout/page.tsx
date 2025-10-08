"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase-client"

export default function LogoutPage() {
  useEffect(() => {
    const logout = async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = "/auth"
    }
    
    logout()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Logging out...</h1>
        <p className="text-gray-600">Please wait while we sign you out.</p>
      </div>
    </div>
  )
}
