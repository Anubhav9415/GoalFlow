import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Routes that require authentication
const isProtectedRoute = createRouteMatcher(['/app(.*)', '/onboarding(.*)'])

// Routes only for unauthenticated users (login/sign-up pages)
const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

// Public routes accessible to everyone
const isPublicRoute = createRouteMatcher(['/', '/login'])

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute(request) && !userId) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect_url', request.url)
    return NextResponse.redirect(signInUrl)
  }

  // Authenticated users on login/signup go to dashboard
  // (onboarding redirect is handled client-side in the app)
  if (isAuthRoute(request) && userId) {
    return NextResponse.redirect(new URL('/app/dashboard', request.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
