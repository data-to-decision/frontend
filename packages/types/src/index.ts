// Auth Types
export type OnboardingStatus = 'completed' | 'pending_profile' | 'pending_org';

export interface User {
  id: string;
  email: string;
  name: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  role: UserRole;
  organizationId: string | null;
  organizationRole: OrganizationRole | null;
  createdAt: string;
  updatedAt: string;
  onboardingComplete: boolean;
  onboardingStatus?: OnboardingStatus;
}

export type UserRole = 'user' | 'admin' | 'superadmin';
export type OrganizationRole = 'owner' | 'admin' | 'member';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  domain: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  organizationId: string;
  status: JoinRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

// Auth Flow Types
export type EmailDomainType = 'personal' | 'work';

export type DomainAction =
  | 'none'                    // Personal email
  | 'organization_created'    // First user from domain
  | 'join_request_created';   // Existing org

export interface DomainSignupResult {
  action: DomainAction;
  isWorkEmail: boolean;
  domain: string | null;
  organization: Organization | null;
  joinRequest: JoinRequest | null;
}

// Magic Link API Types
export interface MagicLinkRequest {
  email: string;
}

export interface MagicLinkResponse {
  message: string;
  is_work_email?: boolean;
  domain_action?: 'create_organization' | 'request_to_join';
  existing_organization?: {
    name: string;
    slug: string;
  };
}

export interface TokenVerifyRequest {
  token: string;
}

/**
 * User data as returned from the API in snake_case format
 * Used in TokenResponse since the verify endpoint returns raw API format
 */
export interface TokenResponseUser {
  id: string;
  email: string;
  name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  timezone?: string | null;
  is_system_admin: boolean;
  created_at: string;
  updated_at: string;
  onboarding_status?: OnboardingStatus;
}

/**
 * Token response from verify and refresh endpoints
 *
 * Note: refresh_token may not be present in the response body if the backend
 * sends it via httpOnly cookie (Set-Cookie header) instead.
 */
export interface TokenResponse {
  access_token: string;
  /** @deprecated refresh_token is now sent via httpOnly cookie, not in response body */
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user?: TokenResponseUser;
  domain_signup?: DomainSignupApiResult;
}

// API domain signup result - matches backend response format
export type DomainSignupAction =
  | 'organization_created'
  | 'join_request_created'
  | 'already_member'
  | 'request_pending';

export interface OrganizationContext {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
}

export interface JoinRequestContext {
  id: string;
  organization_id: string;
  status: JoinRequestStatus;
  created_at: string;
}

export interface DomainSignupApiResult {
  action: DomainSignupAction;
  organization?: OrganizationContext;
  join_request?: JoinRequestContext;
}

export interface AuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  user: User | null;
  domainSignup: DomainSignupResult | null;
  error: string | null;
}

// Onboarding Types
export type OnboardingStep =
  | 'profile'
  | 'organization'
  | 'pending'
  | 'complete';

export interface ProfileData {
  name: string;
  displayName: string | null;
  jobTitle: string | null;
  avatarUrl: string | null;
}

export interface OrganizationData {
  name: string;
  logoUrl: string | null;
}

export interface OnboardingState {
  currentStep: OnboardingStep;
  profileData: Partial<ProfileData>;
  organizationData: Partial<OrganizationData>;
  isComplete: boolean;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

// Team Management Types
export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: OrganizationRole;
  jobTitle: string | null;
  joinedAt: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: OrganizationRole;
  status: InvitationStatus;
  invitedBy: string;
  invitedByName: string;
  sentAt: string;
  expiresAt: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface TeamJoinRequest {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  requestedAt: string;
  message: string | null;
}

export interface TeamState {
  members: TeamMember[];
  invitations: TeamInvitation[];
  joinRequests: TeamJoinRequest[];
  isLoading: boolean;
  error: string | null;
}

// Profile Settings Types
export interface ProfileSettings {
  name: string;
  jobTitle: string | null;
  avatarUrl: string | null;
  timezone: string;
}

// Session Management Types
export interface Session {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  location: string;
  ipAddress: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface SessionState {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
}

// Activity Log Types
export interface ActivityLogEntry {
  id: string;
  action: string;
  organizationId: string | null;
  teamId: string | null;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface ActivityLogState {
  entries: ActivityLogEntry[];
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

// Organization Settings Types
export interface OrganizationSettings {
  defaultTimezone: string;
  allowJoinRequests: boolean;
  domainRestrictions: string[];
  mfaRequired: boolean;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: OrganizationRole;
  joinedAt: string;
}

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  actorType: string;
  actorId: string | null;
  actorName: string;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  changes: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  members: OrganizationMember[];
  settings: OrganizationSettings | null;
  auditLog: AuditLogEntry[];
  auditLogHasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

// Sidebar State Types
export interface SidebarState {
  isCollapsed: boolean;
}
