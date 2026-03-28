/**
 * CSRF token utilities for auth endpoints
 *
 * The backend sets a d2d_csrf_token cookie (non-httpOnly, readable by JS) on login.
 * This token must be included in the X-CSRF-Token header for POST requests to:
 * - /api/auth/refresh
 * - /api/auth/logout
 * - /api/auth/logout-all
 */

/**
 * Get the CSRF token from the cookie
 *
 * @returns The CSRF token value or null if not found (e.g., SSR or cookie not set)
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/d2d_csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
