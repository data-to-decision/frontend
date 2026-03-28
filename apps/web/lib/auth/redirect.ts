/**
 * Safe redirect utility for authentication flows
 *
 * Works in both component and non-component code contexts
 * Handles SSR environments where window is not available
 */

const LOGIN_PATH = '/login';

/**
 * Redirect to the login page
 *
 * This function safely handles:
 * - SSR environments (no-op when window is undefined)
 * - Optional return URL preservation
 * - Avoiding redirect loops (won't redirect if already on login page)
 *
 * @param returnUrl - Optional URL to redirect back to after login
 */
export function redirectToLogin(returnUrl?: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Avoid redirect loops
  if (window.location.pathname === LOGIN_PATH) {
    return;
  }

  // Build the login URL with optional return path
  const currentPath = returnUrl ?? window.location.pathname + window.location.search;
  const loginUrl = currentPath && currentPath !== '/'
    ? `${LOGIN_PATH}?returnTo=${encodeURIComponent(currentPath)}`
    : LOGIN_PATH;

  window.location.href = loginUrl;
}

/**
 * Check if we're currently on the login page
 *
 * @returns true if on the login page, false otherwise or in SSR
 */
export function isOnLoginPage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.location.pathname === LOGIN_PATH;
}
