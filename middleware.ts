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

/**
 * Decode a JWT payload at the Edge (no network call, no secret needed).
 * Only used for UX-level role gating. Backend enforces real RBAC on every request.
 */
function decodeJwtRole(token: string): string | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
        const payload = JSON.parse(atob(padded));
        return payload?.role ?? null;
    } catch {
        return null;
    }
}

export default withCSWAuth({
    ssoUrl:       process.env.NEXT_PUBLIC_AUTH_URL,
    callbackPath: "/auth/callback",
    publicPaths: [
        "/",
    ],
    onRequest: (req, isAuthenticated) => {
        if (!isAuthenticated) return; // let withCSWAuth handle the redirect

        const { pathname } = req.nextUrl;

        // ── Admin route protection ────────────────────────────────────────────
        // /admin/* is restricted to admin and superadmin roles.
        // Non-admin users are silently redirected to /dashboard.
        // The backend API still enforces RBAC on every actual data request.
        if (pathname.startsWith("/admin")) {
            const token = req.cookies.get("Authentication")?.value;
            const role = token ? decodeJwtRole(token) : null;
            if (role !== "admin" && role !== "superadmin") {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }
        }

        // ── No-cache headers for protected dashboard routes ───────────────────
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
