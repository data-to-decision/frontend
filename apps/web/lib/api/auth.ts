/**
 * Authentication API functions
 */

import type {
  MagicLinkRequest,
  MagicLinkResponse,
  TokenVerifyRequest,
  TokenResponse,
  User,
} from '@d2d/types';
import { api } from './client';
import { authApi } from './authenticated-client';
import { getCsrfToken } from '../auth/csrf';

/**
 * User profile response from the /api/users/me endpoint
 * Maps backend snake_case to frontend camelCase User type
 */
export interface UserProfileResponse {
  id: string;
  email: string;
  name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string | null;
  locale: string | null;
  status: string;
  is_system_admin: boolean;
  email_verified_at: string | null;
  last_login_at: string | null;
  last_active_at: string | null;
  login_count: number;
  created_at: string;
  updated_at: string;
  onboarding_status?: 'completed' | 'pending_profile' | 'pending_org';
}

/**
 * Request a magic link to be sent to the user's email
 *
 * @param email - The user's email address
 * @returns Magic link response with domain information
 */
export async function requestMagicLink(
  email: string
): Promise<MagicLinkResponse> {
  const request: MagicLinkRequest = { email };
  return api.post<MagicLinkResponse, MagicLinkRequest>(
    '/api/auth/magic-link',
    request
  );
}

/**
 * Verify a magic link token and exchange it for access/refresh tokens
 *
 * The refresh token is returned via httpOnly cookie (Set-Cookie header).
 * The access token and metadata are returned in the response body.
 *
 * @param token - The magic link token from the email
 * @returns Token response with access token and optional user/domain info
 */
export async function verifyMagicLink(token: string): Promise<TokenResponse> {
  const request: TokenVerifyRequest = { token };
  return api.post<TokenResponse, TokenVerifyRequest>(
    '/api/auth/verify',
    request,
    { includeCredentials: true }
  );
}

/**
 * Refresh an expired access token using the httpOnly refresh token cookie
 *
 * The refresh token is automatically sent via cookie by the browser.
 * A new refresh token is returned via httpOnly cookie (Set-Cookie header).
 * The new access token is returned in the response body.
 *
 * @returns New token response with fresh access token
 */
export async function refreshAccessToken(): Promise<TokenResponse> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  // No body needed - refresh token is sent automatically via cookie
  return api.post<TokenResponse>(
    '/api/auth/refresh',
    undefined,
    { includeCredentials: true, headers }
  );
}

/**
 * Transform backend UserProfileResponse to frontend User type
 */
function transformUserProfile(profile: UserProfileResponse): User {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    timezone: profile.timezone,
    // Map status and is_system_admin to role
    role: profile.is_system_admin ? 'superadmin' : 'user',
    // These fields are not in the profile response, set defaults
    organizationId: null,
    organizationRole: null,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    // User is considered onboarded if they have a name set or onboarding_status is completed
    onboardingComplete: profile.onboarding_status === 'completed' || !!profile.name,
    onboardingStatus: profile.onboarding_status,
  };
}

/**
 * Get the current authenticated user's profile
 *
 * Uses the authenticated API client which handles token refresh automatically.
 *
 * @returns The current user's profile
 * @throws ApiError if not authenticated or request fails
 */
export async function getCurrentUser(): Promise<User> {
  const response = await authApi.get<UserProfileResponse>('/api/users/me');
  return transformUserProfile(response);
}

/**
 * Request body for updating user profile
 */
export interface UserProfileUpdateRequest {
  name?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  timezone?: string | null;
  locale?: string | null;
  onboarding_status?: 'completed' | 'pending_profile' | 'pending_org';
}

/**
 * Update the current authenticated user's profile
 *
 * Uses the authenticated API client which handles token refresh automatically.
 * The backend will automatically update onboarding_status when profile is completed.
 *
 * @param data - Profile fields to update
 * @returns The updated user's profile
 * @throws ApiError if not authenticated or request fails
 */
export async function updateCurrentUser(data: UserProfileUpdateRequest): Promise<User> {
  const response = await authApi.patch<UserProfileResponse, UserProfileUpdateRequest>(
    '/api/users/me',
    data
  );
  return transformUserProfile(response);
}

/**
 * Response from account deactivation endpoint
 */
export interface AccountDeactivationResponse {
  message: string;
  deactivated_at: string;
}

/**
 * Deactivate the current user's account
 *
 * This performs a soft deletion - the account status is set to 'deactivated'.
 * The user's data is preserved but they will no longer be able to log in.
 * All active sessions are revoked immediately.
 *
 * WARNING: This action is immediate and will log the user out of all devices.
 *
 * @returns Confirmation message and deactivation timestamp
 * @throws ApiError if not authenticated or request fails
 */
export async function deactivateAccount(): Promise<AccountDeactivationResponse> {
  return authApi.delete<AccountDeactivationResponse>('/api/users/me');
}

// ============================================================================
// Session Management API
// ============================================================================

/**
 * Session response from the backend /api/auth/sessions endpoint
 * Uses snake_case to match the backend schema
 */
export interface SessionApiResponse {
  id: string;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  location_country: string | null;
  location_city: string | null;
  last_activity_at: string;
  created_at: string;
  is_current: boolean;
}

/**
 * Response from session revocation and logout-all endpoints
 */
export interface SessionActionResponse {
  message: string;
}

/**
 * Transform backend SessionApiResponse to frontend Session type
 *
 * @param apiSession - Session data from the API (snake_case)
 * @returns Session object in frontend format (camelCase)
 */
export function transformSessionResponse(
  apiSession: SessionApiResponse
): import('@d2d/types').Session {
  // Build device name from device_type, browser, and OS
  const deviceType = apiSession.device_type
    ? apiSession.device_type.charAt(0).toUpperCase() + apiSession.device_type.slice(1)
    : 'Unknown Device';
  const browser = apiSession.browser || 'Unknown Browser';
  const os = apiSession.os || 'Unknown OS';
  const deviceName = `${deviceType} - ${browser} on ${os}`;

  // Build location string from city and country
  const locationParts: string[] = [];
  if (apiSession.location_city) {
    locationParts.push(apiSession.location_city);
  }
  if (apiSession.location_country) {
    locationParts.push(apiSession.location_country);
  }
  const location = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown Location';

  return {
    id: apiSession.id,
    deviceName,
    browser,
    os,
    location,
    ipAddress: 'Unknown', // API doesn't provide IP address
    lastActiveAt: apiSession.last_activity_at,
    createdAt: apiSession.created_at,
    isCurrent: apiSession.is_current,
  };
}

/**
 * Get all active sessions for the current user
 *
 * Uses the authenticated API client which handles token refresh automatically.
 * The backend uses the device_id cookie to identify the current session.
 *
 * @returns Array of Session objects with isCurrent flag set by backend
 * @throws ApiError if not authenticated or request fails
 */
export async function getSessions(): Promise<import('@d2d/types').Session[]> {
  const response = await authApi.get<SessionApiResponse[]>('/api/auth/sessions');
  return response.map((session) => transformSessionResponse(session));
}

/**
 * Revoke (delete) a specific session by ID
 *
 * This will immediately end the session, logging out that device.
 *
 * @param sessionId - The UUID of the session to revoke
 * @returns Confirmation message
 * @throws ApiError if not authenticated or request fails
 */
export async function revokeSessionById(sessionId: string): Promise<SessionActionResponse> {
  return authApi.delete<SessionActionResponse>(`/api/auth/sessions/${sessionId}`);
}

/**
 * Log out of all sessions (revoke all)
 *
 * WARNING: This will log out ALL sessions including the current one.
 * After calling this, the user will need to re-authenticate.
 *
 * @returns Confirmation message
 * @throws ApiError if not authenticated or request fails
 */
export async function logoutAllSessions(): Promise<SessionActionResponse> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return authApi.post<SessionActionResponse>('/api/auth/logout-all', undefined, { headers });
}

/**
 * Log out the current session
 *
 * This revokes the current session and clears the refresh token cookie.
 * The client should also clear local tokens after calling this.
 *
 * @returns Confirmation message
 * @throws ApiError if not authenticated or request fails
 */
export async function logout(): Promise<SessionActionResponse> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return authApi.post<SessionActionResponse>('/api/auth/logout', undefined, { headers });
}

// ============================================================================
// Activity Log API
// ============================================================================

/**
 * Activity log entry response from the backend /api/users/me/activity endpoint
 * Uses snake_case to match the backend schema
 */
export interface ActivityLogEntryApiResponse {
  id: string;
  action: string;
  organization_id: string | null;
  team_id: string | null;
  resource_type: string | null;
  resource_id: string | null;
  resource_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Paginated activity feed response from the backend
 */
export interface ActivityFeedApiResponse {
  items: ActivityLogEntryApiResponse[];
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * Transform backend ActivityLogEntryApiResponse to frontend ActivityLogEntry type
 *
 * @param apiEntry - Activity log entry from the API (snake_case)
 * @returns ActivityLogEntry object in frontend format (camelCase)
 */
export function transformActivityLogEntry(
  apiEntry: ActivityLogEntryApiResponse
): import('@d2d/types').ActivityLogEntry {
  const metadata = apiEntry.metadata ?? {};

  // Extract ipAddress and userAgent from metadata (backend stores them there)
  const ipAddress =
    typeof metadata.ip_address === 'string' ? metadata.ip_address : 'Unknown';
  const userAgent =
    typeof metadata.user_agent === 'string' ? metadata.user_agent : '';

  return {
    id: apiEntry.id,
    action: apiEntry.action,
    organizationId: apiEntry.organization_id,
    teamId: apiEntry.team_id,
    resourceType: apiEntry.resource_type,
    resourceId: apiEntry.resource_id,
    metadata,
    ipAddress,
    userAgent,
    createdAt: apiEntry.created_at,
  };
}

/**
 * Response type for the transformed activity feed
 */
export interface ActivityFeedResponse {
  entries: import('@d2d/types').ActivityLogEntry[];
  hasMore: boolean;
}

/**
 * Get paginated activity log for the current user
 *
 * Uses the authenticated API client which handles token refresh automatically.
 *
 * @param limit - Maximum number of entries to return (1-100, default 50)
 * @param offset - Number of entries to skip for pagination (default 0)
 * @returns Paginated activity log entries
 * @throws ApiError if not authenticated or request fails
 */
export async function getActivityLog(
  limit: number = 50,
  offset: number = 0
): Promise<ActivityFeedResponse> {
  const params = new URLSearchParams({
    limit: String(Math.min(Math.max(limit, 1), 100)),
    offset: String(Math.max(offset, 0)),
  });

  const response = await authApi.get<ActivityFeedApiResponse>(
    `/api/users/me/activity?${params.toString()}`
  );

  return {
    entries: response.items.map(transformActivityLogEntry),
    hasMore: response.has_more,
  };
}
