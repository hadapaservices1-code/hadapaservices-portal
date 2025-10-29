import { createBrowserClient } from '@supabase/ssr'

// Store original fetch to restore later if needed
const originalFetch = typeof window !== 'undefined' ? window.fetch : fetch

// Custom fetch wrapper with better error handling for network failures
function customFetch(url: RequestInfo | URL, options?: RequestInit): Promise<Response> {
  // Check if we're online before making the request
  if (typeof window !== 'undefined' && !navigator.onLine) {
    console.warn('Device appears to be offline - request cancelled')
    // Return a rejected promise that Supabase can handle gracefully
    return Promise.reject(new TypeError('Network request failed: Device is offline'))
  }

  // Use original fetch to avoid recursion issues
  return originalFetch(url, options).catch((error) => {
    // Log network errors for debugging but let them propagate
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      // Network error - could be offline, CORS, connection issue, or service unavailable
      const urlString = typeof url === 'string' ? url : url.toString()
      const errorInfo = {
        url: urlString,
        method: options?.method || 'GET',
        error: error.message,
        timestamp: new Date().toISOString(),
        online: typeof window !== 'undefined' ? navigator.onLine : true,
      }
      
      // Only log if it's an auth-related endpoint to avoid spam
      if (errorInfo.url.includes('/auth/') || errorInfo.url.includes('/token')) {
        console.warn('Network error during Supabase auth request:', errorInfo)
        
        // Check if this is a token refresh failure
        if (errorInfo.url.includes('/token?grant_type=refresh_token') || errorInfo.url.includes('refresh_token')) {
          console.warn('Token refresh failed - this is usually non-critical. User session will remain valid until token expires.')
          
          // Suppress the error from showing as uncaught
          // The error will still propagate to Supabase which handles it internally
          error.suppressed = true
        }
      }
    }
    
    // Re-throw the error so Supabase can handle it properly
    throw error
  })
}

// Initialize custom fetch globally for browser environment only
if (typeof window !== 'undefined' && typeof window.fetch !== 'undefined') {
  // Store if we've already patched to avoid double patching
  if (!(window as any).__supabaseFetchPatched) {
    // Override global fetch with our custom version
    window.fetch = customFetch
    ;(window as any).__supabaseFetchPatched = true
  }
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cfgglbgqpwbijupjmujf.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dsYmdxcHdiaWp1cGptdWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NDMwOTAsImV4cCI6MjA3NTQxOTA5MH0.3YxduqtWmcyijl4Jcvkz5KSUbTyvGLOWNA-Z_09hmPw'
  
  const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-auth-token',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      flowType: 'pkce',
      // Add retry configuration to reduce aggressive refresh attempts
      autoRefreshTokenInterval: 60000, // 60 seconds (default)
    },
  })

  // Set up auth state change listener to handle refresh failures gracefully
  if (typeof window !== 'undefined') {
    client.auth.onAuthStateChange((event, session) => {
      // Suppress token refresh errors from appearing as uncaught
      if (event === 'TOKEN_REFRESHED') {
        // Silently handle successful refresh - no need to log every time
        if (process.env.NODE_ENV === 'development') {
          console.debug('Token refreshed successfully')
        }
      } else if (event === 'SIGNED_OUT') {
        // This might happen if refresh fails repeatedly
        console.log('User signed out - may be due to expired refresh token or network issues')
      } else if (event === 'SIGNED_IN') {
        // User signed in - reset any error states
        if (process.env.NODE_ENV === 'development') {
          console.debug('User signed in successfully')
        }
      }
    })

    // Add unhandled error suppression for known Supabase network errors
    if (typeof window.addEventListener !== 'undefined') {
      const errorHandler = (event: ErrorEvent) => {
        // Suppress "Failed to fetch" errors from Supabase auth refresh
        if (
          event.error instanceof TypeError &&
          event.error.message === 'Failed to fetch' &&
          event.error.stack?.includes('supabase') &&
          event.error.stack?.includes('_refreshAccessToken')
        ) {
          console.warn('Supabase token refresh network error suppressed (non-critical)', {
            message: event.error.message,
            url: window.location.href,
          })
          event.preventDefault() // Prevent error from showing in console
          return false
        }
      }

      // Only add listener once
      if (!(window as any).__supabaseErrorHandlerAdded) {
        window.addEventListener('error', errorHandler, true)
        ;(window as any).__supabaseErrorHandlerAdded = true
      }
    }
  }

  return client
}
