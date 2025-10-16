import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cfgglbgqpwbijupjmujf.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dsYmdxcHdiaWp1cGptdWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NDMwOTAsImV4cCI6MjA3NTQxOTA5MH0.3YxduqtWmcyijl4Jcvkz5KSUbTyvGLOWNA-Z_09hmPw'
    )

    // For expense categories, we don't need authentication since they're public data
    // Get active expense categories
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching expense categories:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch expense categories' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data: data || [] },
      { status: 200 }
    )
  } catch (error) {
    console.error('API error fetching expense categories:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
