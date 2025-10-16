"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  const runDebugChecks = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const info: any = {}

    try {
      // Check Supabase connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      info.connection = {
        success: !!connectionTest,
        error: connectionError?.message
      }

      // Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      info.session = {
        exists: !!session,
        user_id: session?.user?.id,
        email: session?.user?.email,
        error: sessionError?.message
      }

      // Check auth users
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      info.user = {
        exists: !!user,
        id: user?.id,
        email: user?.email,
        confirmed: !!user?.email_confirmed_at,
        error: userError?.message
      }

      // Check profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .limit(5)
      info.profiles = {
        count: profiles?.length || 0,
        data: profiles,
        error: profilesError?.message
      }

      // Test signup
      const testEmail = `test-${Date.now()}@example.com`
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'test123456',
        options: {
          data: {
            full_name: 'Test User',
            role: 'employee'
          }
        }
      })
      info.signupTest = {
        success: !!signupData.user,
        user_id: signupData.user?.id,
        error: signupError?.message
      }

      // Clean up test user if created
      if (signupData.user) {
        await supabase.auth.admin.deleteUser(signupData.user.id)
      }

    } catch (error) {
      info.generalError = error instanceof Error ? error.message : 'Unknown error'
    }

    setDebugInfo(info)
    setIsLoading(false)
  }

  const testLogin = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'test123456'
      })
      
      console.log('Test login result:', { data, error })
      alert(`Login test: ${error ? `Error: ${error.message}` : 'Success!'}`)
    } catch (err) {
      console.error('Test login error:', err)
      alert(`Login test failed: ${err}`)
    }
    
    setIsLoading(false)
  }

  useEffect(() => {
    runDebugChecks()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug Tool</CardTitle>
            <CardDescription>
              This tool helps diagnose authentication issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={runDebugChecks} disabled={isLoading}>
                {isLoading ? "Running..." : "Run Debug Checks"}
              </Button>
              <Button onClick={testLogin} disabled={isLoading} variant="outline">
                Test Login
              </Button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Debug Information:</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
