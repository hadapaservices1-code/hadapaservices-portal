import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cfgglbgqpwbijupjmujf.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dsYmdxcHdiaWp1cGptdWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NDMwOTAsImV4cCI6MjA3NTQxOTA5MH0.3YxduqtWmcyijl4Jcvkz5KSUbTyvGLOWNA-Z_09hmPw'
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
}
