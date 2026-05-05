import { NextRequest, NextResponse } from "next/server";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3003';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authCookie = req.cookies.get("Authentication");
  const isAuthenticated = Boolean(authCookie?.value);

  // List of protected base paths that require auth
  const protectedPaths = ["/dashboard", "/agents", "/models", "/api-keys", "/analytics", "/knowledge-base", "/workflows", "/settings", "/image-generation"];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // If authenticated user tries to visit home page or local auth pages, redirect to dashboard
  if (isAuthenticated && (pathname === '/' || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If going to a protected route but not authenticated, send to central login
  if (!isAuthenticated && isProtectedPath) {
    const loginUrl = new URL(`${AUTH_URL}/login`);
    loginUrl.searchParams.set('redirect', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // If going to local sign-in/up page (and NOT authenticated), immediately redirect to central Auth
  if (!isAuthenticated && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    const target = `${AUTH_URL}/login?redirect=${encodeURIComponent(`${req.nextUrl.origin}/dashboard`)}`;
    return NextResponse.redirect(new URL(target));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
