/**
 * Invitation API functions
 *
 * Provides typed functions for accepting/declining invitations via token.
 * The getInvitationByToken function uses the unauthenticated API client
 * since viewing invitation details doesn't require authentication.
 * Accept and decline functions use the authenticated client.
 */

import type { OrganizationRole } from '@d2d/types';
import { api } from './client';
import { authApi } from './authenticated-client';

// ============================================================================
// API Response Types (snake_case from backend)
// ============================================================================

/**
 * Invitation type - organization or team
 */
export type InvitationType = 'organization' | 'team';

/**
 * Invitation status
 */
export type InvitationTokenStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';

/**
 * Invitation details response from GET /api/invitations/{token}
 * Uses snake_case to match the backend schema
 */
export interface InvitationDetailsApiResponse {
  id: string;
  type: InvitationType;
  organization_id: string;
  team_id: string | null;
  email: string;
  role: OrganizationRole;
  status: InvitationTokenStatus;
  organization_name: string;
  team_name: string | null;
  inviter_name: string;
  inviter_email: string;
  expires_at: string;
  is_expired: boolean;
}

/**
 * Accept invitation response from POST /api/invitations/{token}/accept
 */
export interface AcceptInvitationApiResponse {
  message: string;
  organization_id?: string;
  team_id?: string;
  role: OrganizationRole;
}

/**
 * Decline invitation response from POST /api/invitations/{token}/decline
 */
export interface DeclineInvitationApiResponse {
  message: string;
}

// ============================================================================
// Frontend Types (camelCase)
// ============================================================================

/**
 * Invitation details in frontend format (camelCase)
 */
export interface InvitationDetails {
  id: string;
  type: InvitationType;
  organizationId: string;
  teamId: string | null;
  email: string;
  role: OrganizationRole;
  status: InvitationTokenStatus;
  organizationName: string;
  teamName: string | null;
  invitedByName: string;
  expiresAt: string;
  isExpired: boolean;
}

/**
 * Accept invitation result in frontend format
 */
export interface AcceptInvitationResult {
  message: string;
  organizationId?: string;
  teamId?: string;
  role: OrganizationRole;
}

/**
 * Decline invitation result in frontend format
 */
export interface DeclineInvitationResult {
  message: string;
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Transform backend InvitationDetailsApiResponse to frontend InvitationDetails
 *
 * @param apiResponse - Invitation data from the API (snake_case)
 * @returns InvitationDetails object in frontend format (camelCase)
 */
export function transformInvitationDetails(
  apiResponse: InvitationDetailsApiResponse
): InvitationDetails {
  return {
    id: apiResponse.id,
    type: apiResponse.type,
    organizationId: apiResponse.organization_id,
    teamId: apiResponse.team_id,
    email: apiResponse.email,
    role: apiResponse.role,
    status: apiResponse.status,
    organizationName: apiResponse.organization_name,
    teamName: apiResponse.team_name,
    invitedByName: apiResponse.inviter_name,
    expiresAt: apiResponse.expires_at,
    isExpired: apiResponse.is_expired,
  };
}

/**
 * Transform backend AcceptInvitationApiResponse to frontend AcceptInvitationResult
 *
 * @param apiResponse - Accept response from the API (snake_case)
 * @returns AcceptInvitationResult object in frontend format (camelCase)
 */
export function transformAcceptInvitationResponse(
  apiResponse: AcceptInvitationApiResponse
): AcceptInvitationResult {
  return {
    message: apiResponse.message,
    organizationId: apiResponse.organization_id,
    teamId: apiResponse.team_id,
    role: apiResponse.role,
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get invitation details by token
 *
 * This is a PUBLIC endpoint - no authentication required.
 * Anyone with the token can view the invitation details.
 *
 * @param token - The invitation token from the URL
 * @returns Invitation details including organization/team info
 * @throws ApiError if token is invalid or request fails
 */
export async function getInvitationByToken(
  token: string
): Promise<InvitationDetails> {
  const response = await api.get<InvitationDetailsApiResponse>(
    `/api/invitations/${token}`
  );
  return transformInvitationDetails(response);
}

/**
 * Accept an invitation
 *
 * Requires authentication - the user must be logged in to accept.
 * The authenticated user's email should match the invitation email.
 *
 * @param token - The invitation token from the URL
 * @returns Result including organization/team ID and role
 * @throws ApiError if not authenticated, email mismatch, or request fails
 */
export async function acceptInvitation(
  token: string
): Promise<AcceptInvitationResult> {
  const response = await authApi.post<AcceptInvitationApiResponse>(
    `/api/invitations/${token}/accept`
  );
  return transformAcceptInvitationResponse(response);
}

/**
 * Decline an invitation
 *
 * Requires authentication - the user must be logged in to decline.
 * The authenticated user's email should match the invitation email.
 *
 * @param token - The invitation token from the URL
 * @returns Confirmation message
 * @throws ApiError if not authenticated, email mismatch, or request fails
 */
export async function declineInvitation(
  token: string
): Promise<DeclineInvitationResult> {
  const response = await authApi.post<DeclineInvitationApiResponse>(
    `/api/invitations/${token}/decline`
  );
  return { message: response.message };
}

/**
 * Pending invitation response from backend (from /api/invitations/pending)
 * This is the InvitationResponse model - simpler than the detail view
 */
export interface PendingInvitationApiResponse {
  id: string;
  token: string;
  type: InvitationType;
  organization_id: string | null;
  organization_name: string | null;
  team_id: string | null;
  team_name: string | null;
  email: string;
  role: OrganizationRole;
  is_guest: boolean;
  status: InvitationTokenStatus;
  message: string | null;
  invited_by: string;
  inviter_name: string | null;
  inviter_email: string | null;
  expires_at: string;
  created_at: string;
}

/**
 * Pending invitation in frontend format
 */
export interface PendingInvitation {
  id: string;
  token: string;
  type: InvitationType;
  organizationId: string | null;
  organizationName: string | null;
  teamId: string | null;
  teamName: string | null;
  email: string;
  role: OrganizationRole;
  isGuest: boolean;
  status: InvitationTokenStatus;
  message: string | null;
  invitedBy: string;
  invitedByName: string | null;
  invitedByEmail: string | null;
  expiresAt: string;
  createdAt: string;
}

/**
 * Transform backend PendingInvitationApiResponse to frontend PendingInvitation
 *
 * @param apiResponse - Pending invitation from the API (snake_case)
 * @returns PendingInvitation object in frontend format (camelCase)
 */
export function transformPendingInvitation(
  apiResponse: PendingInvitationApiResponse
): PendingInvitation {
  return {
    id: apiResponse.id,
    token: apiResponse.token,
    type: apiResponse.type,
    organizationId: apiResponse.organization_id,
    organizationName: apiResponse.organization_name,
    teamId: apiResponse.team_id,
    teamName: apiResponse.team_name,
    email: apiResponse.email,
    role: apiResponse.role,
    isGuest: apiResponse.is_guest,
    status: apiResponse.status,
    message: apiResponse.message,
    invitedBy: apiResponse.invited_by,
    invitedByName: apiResponse.inviter_name,
    invitedByEmail: apiResponse.inviter_email,
    expiresAt: apiResponse.expires_at,
    createdAt: apiResponse.created_at,
  };
}

/**
 * Pending invitations list response from backend
 */
interface PendingInvitationsListApiResponse {
  invitations: PendingInvitationApiResponse[];
  count: number;
}

/**
 * Get all pending invitations for the current user
 *
 * Requires authentication - returns invitations sent to the user's email
 * that are still pending (not yet accepted, declined, or expired).
 *
 * @returns List of pending invitations
 * @throws ApiError if not authenticated or request fails
 */
export async function getPendingInvitations(): Promise<PendingInvitation[]> {
  const response = await authApi.get<PendingInvitationsListApiResponse>(
    '/api/invitations/pending'
  );
  return response.invitations.map(transformPendingInvitation);
}
