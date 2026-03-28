/**
 * Authenticated API client with automatic token refresh
 *
 * This client wraps the base API client and:
 * 1. Automatically attaches access tokens to requests
 * 2. Checks token expiry before making requests
 * 3. Refreshes expired tokens using the httpOnly refresh token cookie
 * 4. Handles concurrent refresh attempts with a promise lock
 * 5. Redirects to login on authentication failure
 */

import type { TokenResponse } from '@d2d/types';
import { ApiError } from './client';
import type { RequestOptions } from './client';
import { refreshAccessToken } from './auth';
import {
  getAccessToken,
  setAccessToken,
  clearTokens,
  isTokenExpired,
} from '../auth/tokens';
import { redirectToLogin } from '../auth/redirect';

/**
 * Promise lock to prevent multiple simultaneous refresh attempts
 * When a refresh is in progress, all other requests will wait for this promise
 */
let refreshPromise: Promise<boolean> | null = null;

/**
 * Synchronous flag to prevent race condition where multiple requests
 * enter attemptTokenRefresh() before refreshPromise is set
 */
let isRefreshing = false;

/**
 * Attempt to refresh the access token
 *
 * Uses a synchronous flag AND promise lock to ensure only one refresh happens at a time.
 * The synchronous flag prevents the race condition where multiple requests could
 * enter before refreshPromise is assigned.
 *
 * The refresh token is sent automatically via httpOnly cookie by the browser.
 *
 * @returns Promise<boolean> - true if refresh succeeded, false otherwise
 */
async function attemptTokenRefresh(): Promise<boolean> {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  // Check synchronous flag to prevent race condition
  if (isRefreshing) {
    // Wait a bit and check again for the promise
    await new Promise(resolve => setTimeout(resolve, 100));
    // After waiting, either refreshPromise is set or refresh completed
    return refreshPromise || Promise.resolve(false);
  }

  // Set synchronous flag immediately to prevent race condition
  isRefreshing = true;

  // Create the refresh promise
  refreshPromise = (async () => {
    try {
      // Call refresh endpoint - refresh token is sent via httpOnly cookie automatically
      const response: TokenResponse = await refreshAccessToken();

      // Store the new access token
      setAccessToken(response.access_token, response.expires_in);

      return true;
    } catch (error) {
      // If refresh fails with 401, the refresh token is invalid/expired
      if (error instanceof ApiError && error.statusCode === 401) {
        clearTokens();
      }
      return false;
    } finally {
      // Clear both locks
      refreshPromise = null;
      isRefreshing = false;
    }
  })();

  return refreshPromise;
}

/**
 * Ensure we have a valid access token
 *
 * If the current token is expired, attempts to refresh it.
 * Returns the valid token or null if authentication failed.
 *
 * @returns Promise<string | null> - Valid access token or null
 */
async function ensureValidToken(): Promise<string | null> {
  // Check if we have a valid token
  const currentToken = getAccessToken();

  if (currentToken && !isTokenExpired()) {
    return currentToken;
  }

  // Token is expired or missing, try to refresh
  const refreshed = await attemptTokenRefresh();

  if (refreshed) {
    return getAccessToken();
  }

  return null;
}

/**
 * Handle authentication failure
 *
 * Clears tokens and redirects to login page
 */
function handleAuthFailure(): void {
  clearTokens();
  redirectToLogin();
}

/**
 * Execute an authenticated API request with automatic token handling
 *
 * @param method - HTTP method
 * @param endpoint - API endpoint
 * @param body - Optional request body
 * @param options - Optional request options
 * @returns Promise with the API response
 */
async function authenticatedRequest<TResponse, TBody = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  body?: TBody,
  options?: Omit<RequestOptions, 'method' | 'body' | 'accessToken'>
): Promise<TResponse> {
  // Ensure we have a valid token before making the request
  const token = await ensureValidToken();

  if (!token) {
    handleAuthFailure();
    // Throw an error to prevent the request from continuing
    throw new ApiError(
      401,
      'Your session has expired. Please sign in again.',
      'No valid authentication token',
      'SESSION_EXPIRED'
    );
  }

  try {
    // Make the request with the token
    const requestOptions: RequestOptions<TBody> = {
      ...options,
      method,
      accessToken: token,
      // Always include credentials for authenticated requests
      includeCredentials: true,
    };

    if (body !== undefined) {
      requestOptions.body = body;
    }

    // Import apiRequest dynamically to avoid circular dependency issues
    const { apiRequest } = await import('./client');
    return await apiRequest<TResponse, TBody>(endpoint, requestOptions);
  } catch (error) {
    // Handle 401 responses - token might have expired during the request
    if (error instanceof ApiError && error.statusCode === 401) {
      // Try to refresh the token once
      const refreshed = await attemptTokenRefresh();

      if (refreshed) {
        // Retry the request with the new token
        const newToken = getAccessToken();

        if (newToken) {
          const retryOptions: RequestOptions<TBody> = {
            ...options,
            method,
            accessToken: newToken,
            includeCredentials: true,
          };

          if (body !== undefined) {
            retryOptions.body = body;
          }

          const { apiRequest } = await import('./client');
          return await apiRequest<TResponse, TBody>(endpoint, retryOptions);
        }
      }

      // Refresh failed, redirect to login
      handleAuthFailure();
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Authenticated API client
 *
 * Use this for all API calls that require authentication.
 * It automatically:
 * - Attaches the access token to requests
 * - Refreshes expired tokens using httpOnly cookie
 * - Handles concurrent refresh attempts
 * - Redirects to login on authentication failure
 *
 * @example
 * // Instead of:
 * const data = await api.get('/api/users', { accessToken: token });
 *
 * // Use:
 * const data = await authApi.get('/api/users');
 */
export const authApi = {
  /**
   * Make an authenticated GET request
   */
  get: <TResponse>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method' | 'body' | 'accessToken'>
  ): Promise<TResponse> =>
    authenticatedRequest<TResponse>('GET', endpoint, undefined, options),

  /**
   * Make an authenticated POST request
   */
  post: <TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: Omit<RequestOptions, 'method' | 'body' | 'accessToken'>
  ): Promise<TResponse> =>
    authenticatedRequest<TResponse, TBody>('POST', endpoint, body, options),

  /**
   * Make an authenticated PUT request
   */
  put: <TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: Omit<RequestOptions, 'method' | 'body' | 'accessToken'>
  ): Promise<TResponse> =>
    authenticatedRequest<TResponse, TBody>('PUT', endpoint, body, options),

  /**
   * Make an authenticated PATCH request
   */
  patch: <TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: Omit<RequestOptions, 'method' | 'body' | 'accessToken'>
  ): Promise<TResponse> =>
    authenticatedRequest<TResponse, TBody>('PATCH', endpoint, body, options),

  /**
   * Make an authenticated DELETE request
   */
  delete: <TResponse>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method' | 'body' | 'accessToken'>
  ): Promise<TResponse> =>
    authenticatedRequest<TResponse>('DELETE', endpoint, undefined, options),
};
