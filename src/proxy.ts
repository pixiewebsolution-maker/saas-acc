import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from './lib/auth'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Upstash Redis and Ratelimit (Bypass if tokens are missing in local dev)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }) 
  : null

const ratelimit = redis 
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, '10 s'), // 50 requests per 10 seconds per IP
      analytics: true,
    })
  : null

export async function proxy(req: NextRequest) {
  const url = req.nextUrl
  const path = url.pathname

  // Apply Rate Limiting to all API routes
  if (path.startsWith('/api') && ratelimit) {
    const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? '127.0.0.1'
    const { success, limit, reset, remaining } = await ratelimit.limit(ip)
    
    if (!success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString()
        }
      })
    }
  }

  const isApi = path.startsWith('/api')
  const isPublicApi = path.startsWith('/api/auth')
  const isAuthPage = path === '/login' || path === '/register'

  // Fetch session
  const session = await getSession(req)

  // 1. API Protection
  if (isApi && !isPublicApi) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Inject tenant info into headers for internal API usage
    const headers = new Headers(req.headers)
    headers.set('x-user-id', session.userId)
    headers.set('x-user-role', session.role)
    if (session.companyId) {
      headers.set('x-company-id', session.companyId)
    }

    // RBAC: Super Admin only paths
    if (path.startsWith('/api/platform') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.next({
      request: {
        headers
      }
    })
  }

  // 2. Page Route Protection
  if (!isApi) {
    if (!session && !isAuthPage && path !== '/') {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (session && isAuthPage) {
      if (session.role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/platform/dashboard', req.url))
      }
      return NextResponse.redirect(new URL('/dashboard', req.url)) // Assuming /dashboard will redirect to tenant specific
    }

    // Super Admin pages
    if (path.startsWith('/platform') && session?.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
