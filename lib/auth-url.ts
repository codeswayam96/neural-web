/**
 * Resolves authentication URLs dynamically based on current environment and window origin.
 *
 * In the browser, window.location.origin is ALWAYS the exact domain the user is visiting
 * (e.g. https://neural.codeswayam.com). This prevents accidental redirection to localhost:3004
 * in production when environment variables are missing, misconfigured, or inlined during build.
 */
export function getNeuralAuthUrls() {
  const isBrowser = typeof window !== "undefined";

  // In the browser, window.location.origin reflects the real domain (e.g. https://neural.codeswayam.com)
  const isLocalhost = isBrowser
    ? window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    : process.env.NODE_ENV !== "production";

  const appOrigin = isBrowser
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || (isLocalhost ? "http://localhost:3004" : "https://neural.codeswayam.com"));

  const defaultAuthUrl = isLocalhost ? "http://localhost:3003" : "https://auth.codeswayam.com";
  const authBase = (process.env.NEXT_PUBLIC_AUTH_URL || defaultAuthUrl).replace(/\/$/, "");

  const returnUrl = `${appOrigin}/dashboard`;
  const loginUrl = `${authBase}/login?app=neural&redirect=${encodeURIComponent(returnUrl)}`;
  const profileUrl = `${authBase}/profile?app=neural&redirect=${encodeURIComponent(returnUrl)}`;

  return { loginUrl, profileUrl, returnUrl, authBase, appOrigin };
}
