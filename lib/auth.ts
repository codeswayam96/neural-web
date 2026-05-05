/**
 * Auth utilities for NeuralHub.
 * Reuses the same codeswayam-auth SSO cookie (Authentication) issued by core-api.
 */
export async function checkUserAuth(apiUrl: string): Promise<{ authenticated: boolean; user?: { id: string; email: string; name: string; role: string } }> {
  try {
    const res = await fetch(`${apiUrl}/auth/check`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return { authenticated: false };
    const data = await res.json().catch(() => ({}));
    return {
      authenticated: data.authenticated === true,
      user: data.user,
    };
  } catch {
    return { authenticated: false };
  }
}

export async function getCurrentUser(apiUrl: string) {
  try {
    const res = await fetch(`${apiUrl}/auth/me`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function getAuthUrl() {
  return process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3003";
}

export function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
}

export function getNeuralApiUrl() {
  return process.env.NEXT_PUBLIC_NEURAL_API_URL || "http://localhost:3005";
}
