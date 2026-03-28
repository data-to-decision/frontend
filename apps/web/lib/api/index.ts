/**
 * API module exports
 */

export { api, apiRequest, ApiError } from './client';
export type { RequestOptions } from './client';

export {
  requestMagicLink,
  verifyMagicLink,
  refreshAccessToken,
  getCurrentUser,
  updateCurrentUser,
  deactivateAccount,
  getSessions,
  revokeSessionById,
  logoutAllSessions,
  logout,
  transformSessionResponse,
  getActivityLog,
  transformActivityLogEntry,
} from './auth';
export type {
  UserProfileResponse,
  AccountDeactivationResponse,
  SessionApiResponse,
  SessionActionResponse,
  ActivityLogEntryApiResponse,
  ActivityFeedApiResponse,
  ActivityFeedResponse,
} from './auth';

export { authApi } from './authenticated-client';

export {
  getCurrentUserOrganizationId,
  getOrganization,
  getCurrentOrganization,
  updateOrganization,
  deleteOrganization,
  listUserOrganizations,
  transformOrganizationResponse,
  transformOrganizationMembership,
  getOrganizationSettings,
  updateOrganizationSettings,
  transformOrganizationSettingsResponse,
  transformOrganizationSettingsToRequest,
} from './organizations';
export type {
  OrganizationApiResponse,
  UserWithOrganizationResponse,
  OrganizationUpdateRequest,
  OrganizationMembershipApiResponse,
  OrganizationMembership,
  OrganizationSettingsApiResponse,
  OrganizationSettingsUpdateRequest,
  OrganizationSettingsFrontend,
} from './organizations';

export {
  listMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  listInvitations,
  cancelInvitation,
  resendInvitation,
  listJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  transformMemberResponse,
  transformInvitationResponse,
  transformJoinRequestResponse,
} from './team';
export type {
  MemberApiResponse,
  ListMembersApiResponse,
  InviteMemberRequest,
  InviteMemberApiResponse,
  UpdateMemberRoleRequest,
  DeleteMemberApiResponse,
  InvitationApiResponse,
  ListInvitationsApiResponse,
  CancelInvitationApiResponse,
  ResendInvitationApiResponse,
  JoinRequestApiResponse,
  ListJoinRequestsApiResponse,
  ApproveJoinRequestRequest,
  RejectJoinRequestRequest,
} from './team';

export {
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,
  getPendingInvitations,
  transformInvitationDetails,
  transformAcceptInvitationResponse,
  transformPendingInvitation,
} from './invitations';
export type {
  InvitationType,
  InvitationTokenStatus,
  InvitationDetailsApiResponse,
  AcceptInvitationApiResponse,
  DeclineInvitationApiResponse,
  InvitationDetails,
  AcceptInvitationResult,
  DeclineInvitationResult,
  PendingInvitationApiResponse,
  PendingInvitation,
} from './invitations';

export { getAuditLogs } from './audit';
export type { AuditLogListResult, AuditLogFilters } from './audit';
