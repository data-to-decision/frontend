/**
 * Organization API functions
 *
 * Provides typed functions for interacting with the organization endpoints.
 * Uses the authenticated API client which handles token refresh automatically.
 */

import type { Organization, OrganizationRole } from '@d2d/types';
import { authApi } from './authenticated-client';

// ============================================================================
// API Response Types (snake_case from backend)
// ============================================================================

/**
 * Organization response from the backend API
 * Uses snake_case to match the backend schema
 */
export interface OrganizationApiResponse {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  domain: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * User profile response with organization info
 * Extended version of UserProfileResponse that includes primary_organization_id
 */
export interface UserWithOrganizationResponse {
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
  primary_organization_id: string | null;
}

/**
 * Request body for updating organization
 */
export interface OrganizationUpdateRequest {
  name?: string;
  logo_url?: string | null;
  domain?: string | null;
}

/**
 * Organization membership response from backend
 * Includes the user's role and membership info
 */
export interface OrganizationMembershipApiResponse {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  status: string;
  plan_id: string | null;
  role: OrganizationRole;
  is_default_org: boolean;
  joined_at: string;
  created_at: string;
}

/**
 * Organization with membership info (frontend format)
 */
export interface OrganizationMembership {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  status: string;
  planId: string | null;
  role: OrganizationRole;
  isDefaultOrg: boolean;
  joinedAt: string;
  createdAt: string;
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Transform backend OrganizationApiResponse to frontend Organization type
 *
 * @param apiOrg - Organization data from the API (snake_case)
 * @returns Organization object in frontend format (camelCase)
 */
export function transformOrganizationResponse(
  apiOrg: OrganizationApiResponse
): Organization {
  return {
    id: apiOrg.id,
    name: apiOrg.name,
    slug: apiOrg.slug,
    logoUrl: apiOrg.logo_url,
    domain: apiOrg.domain,
    createdAt: apiOrg.created_at,
    updatedAt: apiOrg.updated_at,
  };
}

/**
 * Transform backend OrganizationMembershipApiResponse to frontend OrganizationMembership
 *
 * @param apiMembership - Organization membership from API (snake_case)
 * @returns OrganizationMembership in frontend format (camelCase)
 */
export function transformOrganizationMembership(
  apiMembership: OrganizationMembershipApiResponse
): OrganizationMembership {
  return {
    id: apiMembership.id,
    name: apiMembership.name,
    slug: apiMembership.slug,
    logoUrl: apiMembership.logo_url,
    status: apiMembership.status,
    planId: apiMembership.plan_id,
    role: apiMembership.role,
    isDefaultOrg: apiMembership.is_default_org,
    joinedAt: apiMembership.joined_at,
    createdAt: apiMembership.created_at,
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get the current user's primary organization ID
 *
 * Fetches the user profile which includes the primary_organization_id field.
 *
 * @returns The primary organization ID or null if not set
 * @throws ApiError if not authenticated or request fails
 */
export async function getCurrentUserOrganizationId(): Promise<string | null> {
  const response = await authApi.get<UserWithOrganizationResponse>('/api/users/me');
  return response.primary_organization_id;
}

/**
 * Get an organization by ID
 *
 * @param organizationId - The UUID of the organization
 * @returns The organization details
 * @throws ApiError if not authenticated, not found, or request fails
 */
export async function getOrganization(
  organizationId: string
): Promise<Organization> {
  const response = await authApi.get<OrganizationApiResponse>(
    `/api/organizations/${organizationId}`
  );
  return transformOrganizationResponse(response);
}

/**
 * Get the current user's primary organization
 *
 * Convenience function that first fetches the user's primary organization ID,
 * then fetches the organization details.
 *
 * @returns The organization details or null if user has no primary organization
 * @throws ApiError if not authenticated or request fails
 */
export async function getCurrentOrganization(): Promise<Organization | null> {
  const organizationId = await getCurrentUserOrganizationId();

  if (!organizationId) {
    return null;
  }

  return getOrganization(organizationId);
}

/**
 * Update an organization's details
 *
 * @param organizationId - The UUID of the organization
 * @param data - The fields to update
 * @returns The updated organization
 * @throws ApiError if not authenticated, not authorized, or request fails
 */
export async function updateOrganization(
  organizationId: string,
  data: OrganizationUpdateRequest
): Promise<Organization> {
  const response = await authApi.patch<OrganizationApiResponse, OrganizationUpdateRequest>(
    `/api/organizations/${organizationId}`,
    data
  );
  return transformOrganizationResponse(response);
}

/**
 * Delete an organization
 *
 * WARNING: This action is permanent and will remove all organization data.
 *
 * @param organizationId - The UUID of the organization to delete
 * @returns Confirmation message
 * @throws ApiError if not authenticated, not authorized, or request fails
 */
export async function deleteOrganization(
  organizationId: string
): Promise<{ message: string }> {
  return authApi.delete<{ message: string }>(`/api/organizations/${organizationId}`);
}

/**
 * List all organizations the current user belongs to
 *
 * Returns a list of organizations with membership details, including
 * the user's role in each organization.
 *
 * @returns List of organization memberships
 * @throws ApiError if not authenticated or request fails
 */
export async function listUserOrganizations(): Promise<OrganizationMembership[]> {
  const response = await authApi.get<OrganizationMembershipApiResponse[]>(
    '/api/users/me/organizations'
  );
  return response.map(transformOrganizationMembership);
}

// ============================================================================
// Organization Settings Types
// ============================================================================

/**
 * Organization settings response from the backend API
 * Uses snake_case to match the backend schema
 */
export interface OrganizationSettingsApiResponse {
  default_timezone: string;
  allow_join_requests: boolean;
  domain_restrictions: string[];
  mfa_required: boolean;
}

/**
 * Request body for updating organization settings
 */
export interface OrganizationSettingsUpdateRequest {
  default_timezone?: string;
  allow_join_requests?: boolean;
  domain_restrictions?: string[];
  mfa_required?: boolean;
}

/**
 * Frontend format for organization settings (camelCase)
 */
export interface OrganizationSettingsFrontend {
  defaultTimezone: string;
  allowJoinRequests: boolean;
  domainRestrictions: string[];
  mfaRequired: boolean;
}

// ============================================================================
// Organization Settings Transform Functions
// ============================================================================

/**
 * Transform backend OrganizationSettingsApiResponse to frontend format
 *
 * @param apiSettings - Settings data from the API (snake_case)
 * @returns Settings object in frontend format (camelCase)
 */
export function transformOrganizationSettingsResponse(
  apiSettings: OrganizationSettingsApiResponse
): OrganizationSettingsFrontend {
  return {
    defaultTimezone: apiSettings.default_timezone,
    allowJoinRequests: apiSettings.allow_join_requests,
    domainRestrictions: apiSettings.domain_restrictions,
    mfaRequired: apiSettings.mfa_required,
  };
}

/**
 * Transform frontend settings to backend request format
 *
 * @param settings - Settings in frontend format (camelCase)
 * @returns Settings object in backend format (snake_case)
 */
export function transformOrganizationSettingsToRequest(
  settings: Partial<OrganizationSettingsFrontend>
): OrganizationSettingsUpdateRequest {
  const request: OrganizationSettingsUpdateRequest = {};

  if (settings.defaultTimezone !== undefined) {
    request.default_timezone = settings.defaultTimezone;
  }
  if (settings.allowJoinRequests !== undefined) {
    request.allow_join_requests = settings.allowJoinRequests;
  }
  if (settings.domainRestrictions !== undefined) {
    request.domain_restrictions = settings.domainRestrictions;
  }
  if (settings.mfaRequired !== undefined) {
    request.mfa_required = settings.mfaRequired;
  }

  return request;
}

// ============================================================================
// Organization Settings API Functions
// ============================================================================

/**
 * Get organization settings
 *
 * @param organizationId - The UUID of the organization
 * @returns The organization settings
 * @throws ApiError if not authenticated, not found, or request fails
 */
export async function getOrganizationSettings(
  organizationId: string
): Promise<OrganizationSettingsFrontend> {
  const response = await authApi.get<OrganizationSettingsApiResponse>(
    `/api/organizations/${organizationId}/settings`
  );
  return transformOrganizationSettingsResponse(response);
}

/**
 * Update organization settings
 *
 * @param organizationId - The UUID of the organization
 * @param data - The fields to update
 * @returns The updated organization settings
 * @throws ApiError if not authenticated, not authorized, or request fails
 */
export async function updateOrganizationSettings(
  organizationId: string,
  data: Partial<OrganizationSettingsFrontend>
): Promise<OrganizationSettingsFrontend> {
  const requestData = transformOrganizationSettingsToRequest(data);
  const response = await authApi.patch<
    OrganizationSettingsApiResponse,
    OrganizationSettingsUpdateRequest
  >(`/api/organizations/${organizationId}/settings`, requestData);
  return transformOrganizationSettingsResponse(response);
}
