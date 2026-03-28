import type {
  Organization,
  OrganizationMember,
  OrganizationSettings,
  AuditLogEntry,
  OrganizationRole,
} from '@d2d/types';
import { getMockAuth } from './mock-auth';

const ORG_STORAGE_KEY = 'd2d_mock_organization';

export interface MockOrganizationData {
  organizations: Organization[];
  members: OrganizationMember[];
  settings: OrganizationSettings;
  auditLog: AuditLogEntry[];
  initialized: boolean;
}

// Audit log action types
const AUDIT_ACTIONS = [
  { action: 'organization.settings_updated', resourceType: 'organization' },
  { action: 'member.invited', resourceType: 'invitation' },
  { action: 'member.joined', resourceType: 'member' },
  { action: 'member.removed', resourceType: 'member' },
  { action: 'member.role_changed', resourceType: 'member' },
  { action: 'connection.created', resourceType: 'connection' },
  { action: 'connection.deleted', resourceType: 'connection' },
  { action: 'api_key.created', resourceType: 'api_key' },
  { action: 'api_key.revoked', resourceType: 'api_key' },
  { action: 'billing.plan_changed', resourceType: 'billing' },
  { action: 'billing.payment_method_updated', resourceType: 'billing' },
  { action: 'security.mfa_enforced', resourceType: 'security' },
  { action: 'security.domain_verified', resourceType: 'security' },
];

const MOCK_USERS = [
  { name: 'Sarah Chen', email: 'sarah.chen@company.com', role: 'admin' as OrganizationRole },
  { name: 'Marcus Johnson', email: 'marcus.j@company.com', role: 'member' as OrganizationRole },
  { name: 'Elena Rodriguez', email: 'elena.r@company.com', role: 'member' as OrganizationRole },
  { name: 'James Wilson', email: 'james.w@company.com', role: 'member' as OrganizationRole },
  { name: 'Priya Patel', email: 'priya.p@company.com', role: 'admin' as OrganizationRole },
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function generateMockOrganization(): Organization {
  const mockAuth = getMockAuth();

  if (mockAuth.domainSignup?.organization) {
    return mockAuth.domainSignup.organization;
  }

  return {
    id: 'org_' + Date.now(),
    name: 'Acme Corporation',
    slug: 'acme-corp',
    logoUrl: null,
    domain: 'acme.com',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function generateMockMembers(): OrganizationMember[] {
  const mockAuth = getMockAuth();
  const members: OrganizationMember[] = [];

  // Add current user as owner
  if (mockAuth.user) {
    members.push({
      id: 'orgmember_' + mockAuth.user.id,
      userId: mockAuth.user.id,
      name: mockAuth.user.name || 'You',
      email: mockAuth.user.email,
      avatarUrl: mockAuth.user.avatarUrl,
      role: 'owner',
      joinedAt: mockAuth.user.createdAt,
    });
  }

  // Add mock members
  MOCK_USERS.forEach((user, index) => {
    members.push({
      id: `orgmember_${index + 2}`,
      userId: `user_${index + 2}`,
      name: user.name,
      email: user.email,
      avatarUrl: null,
      role: user.role,
      joinedAt: new Date(Date.now() - (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  return members;
}

function generateMockSettings(): OrganizationSettings {
  return {
    defaultTimezone: 'America/Los_Angeles',
    allowJoinRequests: true,
    domainRestrictions: [],
    mfaRequired: false,
  };
}

function generateMockAuditLog(): AuditLogEntry[] {
  const mockAuth = getMockAuth();
  const entries: AuditLogEntry[] = [];
  const allUsers = [
    { id: mockAuth.user?.id || 'user_1', name: mockAuth.user?.name || 'You', email: mockAuth.user?.email || 'user@company.com' },
    ...MOCK_USERS.map((u, i) => ({ id: `user_${i + 2}`, name: u.name, email: u.email })),
  ];

  // Generate 40-60 audit entries
  const numEntries = 40 + Math.floor(Math.random() * 21);

  // Get organization ID for audit entries
  const orgId = getMockOrganization().organizations[0]?.id || 'org_mock';

  for (let i = 0; i < numEntries; i++) {
    const auditType = getRandomElement(AUDIT_ACTIONS);
    const actor = getRandomElement(allUsers);
    const createdAt = new Date(
      Date.now() - i * (Math.random() * 12 + 6) * 60 * 60 * 1000
    );

    entries.push({
      id: `audit_${Date.now()}_${i}`,
      organizationId: orgId,
      actorType: 'user',
      action: auditType.action,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      resourceType: auditType.resourceType,
      resourceId: `${auditType.resourceType}_${i}`,
      changes: null,
      metadata: generateAuditMetadata(auditType.action),
      ipAddress: generateRandomIP(),
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      createdAt: createdAt.toISOString(),
    });
  }

  return entries;
}

function generateAuditMetadata(action: string): Record<string, unknown> {
  switch (action) {
    case 'organization.settings_updated':
      return { changes: ['defaultTimezone'] };
    case 'member.invited':
      return { email: 'newuser@company.com', role: 'member' };
    case 'member.role_changed':
      return { from: 'member', to: 'admin', memberId: 'user_3' };
    case 'connection.created':
      return { type: 'postgresql', name: 'Analytics DB' };
    case 'billing.plan_changed':
      return { from: 'starter', to: 'professional' };
    case 'security.mfa_enforced':
      return { enforcedAt: new Date().toISOString() };
    default:
      return {};
  }
}

export function getMockOrganization(): MockOrganizationData {
  if (typeof window === 'undefined') {
    return {
      organizations: [],
      members: [],
      settings: generateMockSettings(),
      auditLog: [],
      initialized: false,
    };
  }

  const data = localStorage.getItem(ORG_STORAGE_KEY);
  if (!data) {
    return {
      organizations: [],
      members: [],
      settings: generateMockSettings(),
      auditLog: [],
      initialized: false,
    };
  }

  try {
    return JSON.parse(data);
  } catch {
    return {
      organizations: [],
      members: [],
      settings: generateMockSettings(),
      auditLog: [],
      initialized: false,
    };
  }
}

export function setMockOrganization(data: Partial<MockOrganizationData>): void {
  if (typeof window === 'undefined') return;
  const current = getMockOrganization();
  localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify({ ...current, ...data }));
}

export function initializeMockOrganization(): MockOrganizationData {
  const existing = getMockOrganization();
  const mockAuth = getMockAuth();
  const currentUser = mockAuth.user;

  // Check if organization was initialized for a different user
  // If so, re-initialize with the current user
  if (existing.initialized && currentUser) {
    const currentUserInMembers = existing.members.some(
      (m) => m.userId === currentUser.id || m.email === currentUser.email
    );

    if (!currentUserInMembers) {
      // Different user logged in, re-initialize
      clearMockOrganization();
      const org = generateMockOrganization();
      const mockData: MockOrganizationData = {
        organizations: [org],
        members: generateMockMembers(),
        settings: generateMockSettings(),
        auditLog: generateMockAuditLog(),
        initialized: true,
      };
      setMockOrganization(mockData);
      return mockData;
    }

    return existing;
  }

  if (existing.initialized) {
    return existing;
  }

  const org = generateMockOrganization();
  const mockData: MockOrganizationData = {
    organizations: [org],
    members: generateMockMembers(),
    settings: generateMockSettings(),
    auditLog: generateMockAuditLog(),
    initialized: true,
  };

  setMockOrganization(mockData);
  return mockData;
}

export function clearMockOrganization(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ORG_STORAGE_KEY);
}

// Organization operations
export function updateOrganizationInfo(updates: Partial<Organization>): Organization | null {
  const data = getMockOrganization();
  if (data.organizations.length === 0) return null;

  data.organizations[0] = {
    ...data.organizations[0],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  setMockOrganization(data);
  return data.organizations[0];
}

export function deleteOrganization(): void {
  clearMockOrganization();
}

// Member operations
export function updateOrgMemberRole(memberId: string, role: OrganizationRole): void {
  const data = getMockOrganization();
  const member = data.members.find((m) => m.id === memberId);
  if (member) {
    member.role = role;
    setMockOrganization(data);
  }
}

export function removeOrgMember(memberId: string): void {
  const data = getMockOrganization();
  data.members = data.members.filter((m) => m.id !== memberId);
  setMockOrganization(data);
}

// Settings operations
export function updateOrgSettings(updates: Partial<OrganizationSettings>): OrganizationSettings {
  const data = getMockOrganization();
  data.settings = { ...data.settings, ...updates };
  setMockOrganization(data);
  return data.settings;
}

// Audit log operations
export function getAuditLogEntries(
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    action?: string;
    actorId?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  }
): { entries: AuditLogEntry[]; hasMore: boolean } {
  const data = getMockOrganization();
  let filtered = data.auditLog;

  if (filters) {
    if (filters.action && filters.action !== 'all') {
      filtered = filtered.filter((e) => e.action.startsWith(filters.action!));
    }
    if (filters.actorId) {
      filtered = filtered.filter((e) => e.actorId === filters.actorId);
    }
    if (filters.resourceType && filters.resourceType !== 'all') {
      filtered = filtered.filter((e) => e.resourceType === filters.resourceType);
    }
    if (filters.startDate) {
      filtered = filtered.filter((e) => new Date(e.createdAt) >= new Date(filters.startDate!));
    }
    if (filters.endDate) {
      filtered = filtered.filter((e) => new Date(e.createdAt) <= new Date(filters.endDate!));
    }
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const entries = filtered.slice(start, end);
  const hasMore = end < filtered.length;

  return { entries, hasMore };
}

// Get unique actors for filtering
export function getAuditLogActors(): Array<{ id: string; name: string }> {
  const data = getMockOrganization();
  const actorsMap = new Map<string, string>();

  data.auditLog.forEach((entry) => {
    if (entry.actorId && !actorsMap.has(entry.actorId)) {
      actorsMap.set(entry.actorId, entry.actorName);
    }
  });

  return Array.from(actorsMap.entries()).map(([id, name]) => ({ id, name }));
}

// Get unique resource types for filtering
export function getAuditLogResourceTypes(): string[] {
  return ['all', 'organization', 'member', 'invitation', 'connection', 'api_key', 'billing', 'security'];
}

// Format audit action for display
export function formatAuditAction(action: string): string {
  const actionMap: Record<string, string> = {
    'organization.settings_updated': 'Updated organization settings',
    'member.invited': 'Invited member',
    'member.joined': 'Member joined',
    'member.removed': 'Removed member',
    'member.role_changed': 'Changed member role',
    'connection.created': 'Created connection',
    'connection.deleted': 'Deleted connection',
    'api_key.created': 'Created API key',
    'api_key.revoked': 'Revoked API key',
    'billing.plan_changed': 'Changed billing plan',
    'billing.payment_method_updated': 'Updated payment method',
    'security.mfa_enforced': 'Enforced MFA requirement',
    'security.domain_verified': 'Verified domain',
  };
  return actionMap[action] || action;
}
