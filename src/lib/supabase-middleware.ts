import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
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

  // If user exists and trying to access auth pages, redirect to dashboard
  if (user && (request.nextUrl.pathname === '/auth' || request.nextUrl.pathname === '/login')) {
    console.log('Middleware - Redirecting to dashboard (user exists)')
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
