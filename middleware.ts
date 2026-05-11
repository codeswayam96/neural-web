import { NextRequest, NextResponse } from "next/server";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3003';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Surrogate-Control': 'no-store',
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authCookie = req.cookies.get("Authentication");
  const isAuthenticated = Boolean(authCookie?.value);

  const protectedPaths = [
    "/dashboard", "/agents", "/models", "/api-keys",
    "/analytics", "/knowledge-base", "/workflows",
    "/settings", "/image-generation", "/billing", "/admin",
  ];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (isAuthenticated && (pathname === '/' || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (!isAuthenticated && isProtectedPath) {
    const loginUrl = new URL(`${AUTH_URL}/login`);
    loginUrl.searchParams.set('redirect', req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (!isAuthenticated && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    const target = `${AUTH_URL}/login?redirect=${encodeURIComponent(`${req.nextUrl.origin}/dashboard`)}`;
    return NextResponse.redirect(new URL(target));
  }

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
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
