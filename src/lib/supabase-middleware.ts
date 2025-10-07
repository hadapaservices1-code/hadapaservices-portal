import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cfgglbgqpwbijupjmujf.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dsYmdxcHdiaWp1cGptdWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NDMwOTAsImV4cCI6MjA3NTQxOTA5MH0.3YxduqtWmcyijl4Jcvkz5KSUbTyvGLOWNA-Z_09hmPw',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              supabaseResponse.cookies.set(name, value, options)
            })
          } catch (error) {
            // Handle cookie setting errors gracefully
            console.error('Error setting cookies:', error)
          }
        },
      },
    }
  )

  // Get the current user
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  console.log('Middleware - User check:', { 
    hasUser: !!user, 
    userId: user?.id, 
    path: request.nextUrl.pathname,
    error: userError?.message 
  })

  // Define public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/auth', '/', '/debug']
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(path + '/')
  )

  // If no user and trying to access protected route, redirect to auth
  if (!user && !isPublicPath) {
    console.log('Middleware - Redirecting to auth (no user)')
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // If user exists and trying to access auth pages, allow access but log it
  if (user && (request.nextUrl.pathname === '/auth' || request.nextUrl.pathname === '/login')) {
    console.log('Middleware - User accessing auth page while logged in:', user.id)
    // Allow access to auth pages even when logged in (for sign out flow)
  }

  return supabaseResponse
}
