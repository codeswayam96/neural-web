import { NextRequest, NextResponse } from "next/server";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3003';

// Headers that prevent Vercel Edge Cache / CDN from caching authenticated pages.
// Without these, Vercel returns 304 Not Modified from its edge cache, causing
// stale or cross-user page responses for dashboard routes.
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Surrogate-Control': 'no-store',
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authCookie = req.cookies.get("Authentication");
  const isAuthenticated = Boolean(authCookie?.value);

  // All protected paths requiring authentication
  const protectedPaths = [
    "/dashboard", "/agents", "/models", "/api-keys",
    "/analytics", "/knowledge-base", "/workflows",
    "/settings", "/image-generation", "/billing", "/admin",
  ];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // If authenticated user tries to visit home page or local auth pages, redirect to dashboard
  if (isAuthenticated && (pathname === '/' || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If going to a protected route but not authenticated, send to central SSO login
  if (!isAuthenticated && isProtectedPath) {
    const loginUrl = new URL(`${AUTH_URL}/login`);
    loginUrl.searchParams.set('redirect', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // If going to local sign-in/up page (and NOT authenticated), redirect to central Auth
  if (!isAuthenticated && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    const target = `${AUTH_URL}/login?redirect=${encodeURIComponent(`${req.nextUrl.origin}/dashboard`)}`;
    return NextResponse.redirect(new URL(target));
  }

  // Allow the request, but set no-cache headers for all protected routes
  // to prevent Vercel Edge from caching per-user authenticated HTML pages.
  const response = NextResponse.next();
  if (isProtectedPath) {
    Object.entries(NO_CACHE_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
