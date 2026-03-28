/**
 * Team Management API functions
 *
 * Provides typed functions for interacting with the team management endpoints.
 * Uses the authenticated API client which handles token refresh automatically.
 */

import type { TeamMember, TeamInvitation, TeamJoinRequest, OrganizationRole } from '@d2d/types';
import { authApi } from './authenticated-client';

// ============================================================================
// API Response Types (snake_case from backend)
// ============================================================================

/**
 * Member response from the backend API
 * Uses snake_case to match the backend schema
 */
export interface MemberApiResponse {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: OrganizationRole;
  joined_at: string;
}

/**
 * List members response
 */
export interface ListMembersApiResponse {
  members: MemberApiResponse[];
  total: number;
}

/**
 * Invite member request body
 */
export interface InviteMemberRequest {
  email: string;
  role: string;
  message?: string;
}

/**
 * Invite member response from the backend
 */
export interface InviteMemberApiResponse {
  message: string;
  invitation_id: string;
  email: string;
  role: OrganizationRole;
  expires_at: string;
}

/**
 * Update member role request body
 */
export interface UpdateMemberRoleRequest {
  role: string;
}

/**
 * Delete member response
 */
export interface DeleteMemberApiResponse {
  message: string;
}

/**
 * Invitation response from the backend API
 */
export interface InvitationApiResponse {
  id: string;
  email: string;
  role: OrganizationRole;
  invited_by: {
    id: string;
    email: string;
    name: string | null;
  };
  created_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

/**
 * List invitations response
 */
export interface ListInvitationsApiResponse {
  invitations: InvitationApiResponse[];
  total: number;
}

/**
 * Cancel invitation response
 */
export interface CancelInvitationApiResponse {
  message: string;
  invitation_id: string;
}

/**
 * Resend invitation response
 */
export interface ResendInvitationApiResponse {
  message: string;
  invitation_id: string;
  new_expires_at: string;
}

/**
 * Join request response from the backend API
 */
export interface JoinRequestApiResponse {
  id: string;
  email: string;
  user_id: string | null;
  user_name: string | null;
  organization_id: string;
  organization_name: string | null;
  organization_slug: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
  message: string | null;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  expires_at: string;
}

/**
 * List join requests response
 */
export interface ListJoinRequestsApiResponse {
  requests: JoinRequestApiResponse[];
  total: number;
}

/**
 * Approve join request request body
 */
export interface ApproveJoinRequestRequest {
  role: string;
}

/**
 * Reject join request request body
 */
export interface RejectJoinRequestRequest {
  reason?: string;
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Transform backend MemberApiResponse to frontend TeamMember type
 *
 * @param apiMember - Member data from the API (snake_case)
 * @returns TeamMember object in frontend format (camelCase)
 */
export function transformMemberResponse(apiMember: MemberApiResponse): TeamMember {
  return {
    id: apiMember.id,
    userId: apiMember.user_id,
    name: apiMember.name || 'Unknown',
    email: apiMember.email,
    avatarUrl: apiMember.avatar_url,
    role: apiMember.role,
    jobTitle: null, // Not provided by API
    joinedAt: apiMember.joined_at,
  };
}

/**
 * Transform backend InvitationApiResponse to frontend TeamInvitation type
 *
 * @param apiInvitation - Invitation data from the API (snake_case)
 * @returns TeamInvitation object in frontend format (camelCase)
 */
export function transformInvitationResponse(
  apiInvitation: InvitationApiResponse
): TeamInvitation {
  return {
    id: apiInvitation.id,
    email: apiInvitation.email,
    role: apiInvitation.role,
    status: apiInvitation.status,
    invitedBy: apiInvitation.invited_by.id,
    invitedByName: apiInvitation.invited_by.name || apiInvitation.invited_by.email,
    sentAt: apiInvitation.created_at,
    expiresAt: apiInvitation.expires_at,
  };
}

/**
 * Transform backend JoinRequestApiResponse to frontend TeamJoinRequest type
 *
 * @param apiRequest - Join request data from the API (snake_case)
 * @returns TeamJoinRequest object in frontend format (camelCase)
 */
export function transformJoinRequestResponse(
  apiRequest: JoinRequestApiResponse
): TeamJoinRequest {
  return {
    id: apiRequest.id,
    userId: apiRequest.user_id || '',
    name: apiRequest.user_name || 'Unknown',
    email: apiRequest.email,
    avatarUrl: null, // Backend doesn't provide avatar URL for join requests
    requestedAt: apiRequest.requested_at,
    message: apiRequest.message,
  };
}

// ============================================================================
// API Functions - Members
// ============================================================================

/**
 * List all members of an organization
 *
 * @param organizationId - The UUID of the organization
 * @returns List of team members
 * @throws ApiError if not authenticated or request fails
 */
export async function listMembers(
  organizationId: string
): Promise<{ members: TeamMember[]; total: number }> {
  const response = await authApi.get<ListMembersApiResponse>(
    `/api/organizations/${organizationId}/members`
  );
  return {
    members: response.members.map(transformMemberResponse),
    total: response.total,
  };
}

/**
 * Invite a member to the organization
 *
 * @param organizationId - The UUID of the organization
 * @param email - Email address to invite
 * @param role - Role to assign to the invitee
 * @param message - Optional message to include in the invitation
 * @returns Invitation details
 * @throws ApiError if not authenticated, not authorized, or request fails
 */
export async function inviteMember(
  organizationId: string,
  email: string,
  role: OrganizationRole,
  message?: string
): Promise<InviteMemberApiResponse> {
  const body: InviteMemberRequest = { email, role, message };
  return authApi.post<InviteMemberApiResponse, InviteMemberRequest>(
    `/api/organizations/${organizationId}/members/invite`,
    body
  );
}

/**
 * Update a member's role in the organization
 *
 * @param organizationId - The UUID of the organization
 * @param userId - The UUID of the user to update
 * @param role - The new role
 * @returns Updated member data
 * @throws ApiError if not authenticated, not authorized, or request fails
 */
export async function updateMemberRole(
  organizationId: string,
  userId: string,
  role: OrganizationRole
): Promise<TeamMember> {
  const body: UpdateMemberRoleRequest = { role };
  const response = await authApi.patch<MemberApiResponse, UpdateMemberRoleRequest>(
    `/api/organizations/${organizationId}/members/${userId}`,
    body
  );
  return transformMemberResponse(response);
}

/**
 * Remove a member from the organization
 *
 * @param organizationId - The UUID of the organization
 * @param userId - The UUID of the user to remove
 * @returns Confirmation message
 * @throws ApiError if not authenticated, not authorized, or request fails
 */
export async function removeMember(
  organizationId: string,
  userId: string
): Promise<DeleteMemberApiResponse> {
  return authApi.delete<DeleteMemberApiResponse>(
    `/api/organizations/${organizationId}/members/${userId}`
  );
}

// ============================================================================
// API Functions - Invitations
// ============================================================================

/**
 * List all pending invitations for an organization
 *
 * @param organizationId - The UUID of the organization
 * @returns List of invitations
 * @throws ApiError if not authenticated or request fails
 */
export async function listInvitations(
  organizationId: string
): Promise<{ invitations: TeamInvitation[]; total: number }> {
  const response = await authApi.get<ListInvitationsApiResponse>(
    `/api/organizations/${organizationId}/invitations`
  );
  return {
    invitations: response.invitations.map(transformInvitationResponse),
    total: response.total,
  };
}

/**
 * Cancel a pending invitation
 *
 * @param organizationId - The UUID of the organization
 * @param invitationId - The UUID of the invitation to cancel
 * @returns Confirmation
 * @throws ApiError if not authenticated, not authorized, or request fails
 */
export async function cancelInvitation(
  organizationId: string,
  invitationId: string
): Promise<CancelInvitationApiResponse> {
  return authApi.delete<CancelInvitationApiResponse>(
    `/api/organizations/${organizationId}/invitations/${invitationId}`
  );
}

/**
 * Resend an invitation
 *
 * @param organizationId - The UUID of the organization
 * @param invitationId - The UUID of the invitation to resend
 * @returns Updated invitation details with new expiration
 * @throws ApiError if not authenticated, not authorized, or request fails
 */
export async function resendInvitation(
  organizationId: string,
  invitationId: string
): Promise<ResendInvitationApiResponse> {
  return authApi.post<ResendInvitationApiResponse>(
    `/api/organizations/${organizationId}/invitations/${invitationId}/resend`
  );
}

// ============================================================================
// API Functions - Join Requests
// ============================================================================

/**
 * List all pending join requests for an organization
 *
 * @param organizationId - The UUID of the organization
 * @returns List of join requests
 * @throws ApiError if not authenticated or request fails
 */
export async function listJoinRequests(
  organizationId: string
): Promise<{ joinRequests: TeamJoinRequest[]; total: number }> {
  const response = await authApi.get<ListJoinRequestsApiResponse>(
    `/api/organizations/${organizationId}/join-requests?status=pending`
  );
  return {
    joinRequests: response.requests.map(transformJoinRequestResponse),
    total: response.total,
  };
}

/**
 * Approve a join request
 *
 * @param organizationId - The UUID of the organization
 * @param requestId - The UUID of the join request
 * @param role - The role to assign to the new member
 * @returns Updated join request data
 * @throws ApiError if not authenticated, not authorized, or request fails
 */
export async function approveJoinRequest(
  organizationId: string,
  requestId: string,
  role: OrganizationRole
): Promise<JoinRequestApiResponse> {
  const body: ApproveJoinRequestRequest = { role };
  return authApi.post<JoinRequestApiResponse, ApproveJoinRequestRequest>(
    `/api/organizations/${organizationId}/join-requests/${requestId}/approve`,
    body
  );
}

/**
 * Reject a join request
 *
 * @param organizationId - The UUID of the organization
 * @param requestId - The UUID of the join request
 * @param reason - Optional reason for rejection
 * @returns Updated join request data
 * @throws ApiError if not authenticated, not authorized, or request fails
 */
export async function rejectJoinRequest(
  organizationId: string,
  requestId: string,
  reason?: string
): Promise<JoinRequestApiResponse> {
  const body: RejectJoinRequestRequest = { reason };
  return authApi.post<JoinRequestApiResponse, RejectJoinRequestRequest>(
    `/api/organizations/${organizationId}/join-requests/${requestId}/reject`,
    body
  );
}
