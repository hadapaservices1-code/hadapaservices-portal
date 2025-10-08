import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cfgglbgqpwbijupjmujf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dsYmdxcHdiaWp1cGptdWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NDMwOTAsImV4cCI6MjA3NTQxOTA5MH0.3YxduqtWmcyijl4Jcvkz5KSUbTyvGLOWNA-Z_09hmPw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// For server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dsYmdxcHdiaWp1cGptdWpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg0MzA5MCwiZXhwIjoyMDc1NDE5MDkwfQ.W2PGBcfk1dQTp-nIxCV5QPtc9XJ1FPIuR7KxTrSzlP8',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
