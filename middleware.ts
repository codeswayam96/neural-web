import { withCSWAuth } from "@codeswayam/auth/middleware";
import { NextResponse } from "next/server";

/**
 * NeuralHub — SSO Middleware
 *
 * All dashboard routes are protected. The onRequest hook adds
 * Cache-Control: no-store headers to protected routes to prevent
 * browsers caching sensitive AI/API-key pages.
 */

const PROTECTED_PREFIXES = [
    "/dashboard", "/agents", "/models", "/api-keys",
    "/analytics", "/knowledge-base", "/workflows",
    "/settings", "/image-generation", "/billing", "/admin",
];

const NO_CACHE_HEADERS: Record<string, string> = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Surrogate-Control": "no-store",
};

export default withCSWAuth({
    ssoUrl:       process.env.NEXT_PUBLIC_AUTH_URL,
    callbackPath: "/auth/callback",
    publicPaths: [
        "/",
    ],
    onRequest: (req, isAuthenticated) => {
        if (!isAuthenticated) return; // let withCSWAuth handle the redirect

        const { pathname } = req.nextUrl;
        const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
        if (!isProtected) return;

        // Authenticated + protected route — add no-cache headers
        const res = NextResponse.next();
        Object.entries(NO_CACHE_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
        return res;
    },
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    ],
};

