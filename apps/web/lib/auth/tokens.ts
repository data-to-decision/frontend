/**
 * Token storage utilities for authentication
 *
 * Security model:
 * - Access tokens are stored in memory only (XSS protection)
 * - Refresh tokens are stored in httpOnly cookies (set by backend)
 * - The browser automatically sends httpOnly cookies with requests
 * - Token expiry is tracked in localStorage for proactive refresh
 */

const TOKEN_EXPIRY_KEY = 'd2d_token_expiry';

// In-memory storage for access token (more secure against XSS)
let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

/**
 * Get the current access token from memory
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Store the access token after successful authentication
 *
 * Note: Refresh token is now handled via httpOnly cookie by the backend.
 * The browser automatically stores and sends the cookie.
 *
 * @param access - The access token (stored in memory)
 * @param expiresIn - Token lifetime in seconds
 */
export function setAccessToken(access: string, expiresIn: number): void {
  // Store access token in memory
  accessToken = access;

  // Calculate expiry timestamp (with 30 second buffer for clock skew)
  const expiryBuffer = 30;
  tokenExpiresAt = Date.now() + (expiresIn - expiryBuffer) * 1000;

  // Store expiry in localStorage for persistence across page reloads
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_EXPIRY_KEY, tokenExpiresAt.toString());
  }
}

/**
 * Clear all stored tokens (logout)
 *
 * Note: The httpOnly refresh token cookie is cleared by the backend
 * during the logout API call. We only clear client-side state here.
 */
export function clearTokens(): void {
  accessToken = null;
  tokenExpiresAt = null;

  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }
}

/**
 * Check if the current access token is expired or about to expire
 *
 * @returns true if the token is expired or will expire within the buffer period
 */
export function isTokenExpired(): boolean {
  // If no token exists, consider it expired
  if (!accessToken || !tokenExpiresAt) {
    return true;
  }

  return Date.now() >= tokenExpiresAt;
}

/**
 * Get the stored token expiry timestamp
 */
export function getTokenExpiresAt(): number | null {
  // First check memory
  if (tokenExpiresAt !== null) {
    return tokenExpiresAt;
  }

  // Fall back to localStorage (for page reloads)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) {
        tokenExpiresAt = parsed;
        return parsed;
      }
    }
  }

  return null;
}

/**
 * Check if there might be a valid session that can be restored
 *
 * Since refresh tokens are in httpOnly cookies (not accessible via JS),
 * we check if we have a stored expiry time as a proxy for "user was logged in".
 * The actual session validity will be confirmed when we make an API call.
 *
 * @returns true if there's evidence of a previous session
 */
export function hasStoredSession(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check if we have stored expiry (indicates user was previously logged in)
  const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  return storedExpiry !== null;
}

/**
 * Restore session state from localStorage
 * This should be called on app initialization to check for existing sessions
 *
 * @returns true if a stored session exists that needs refreshing
 */
export function restoreSessionState(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for evidence of previous session
  const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!storedExpiry) {
    return false;
  }

  // Restore expiry from localStorage
  tokenExpiresAt = parseInt(storedExpiry, 10);

  // Session exists and needs refresh (access token is not in memory)
  return true;
}
