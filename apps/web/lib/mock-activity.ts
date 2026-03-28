import type { ActivityLogEntry } from '@d2d/types';
import { getMockAuth } from './mock-auth';

const ACTIVITY_STORAGE_KEY = 'd2d_mock_activity';

export interface MockActivityData {
  entries: ActivityLogEntry[];
  userId: string | null;
  initialized: boolean;
}

// Activity action types
const ACTIVITY_ACTIONS = [
  { action: 'user.login', resourceType: null, description: 'Logged in' },
  { action: 'user.logout', resourceType: null, description: 'Logged out' },
  { action: 'user.profile_updated', resourceType: 'user', description: 'Updated profile' },
  { action: 'user.password_changed', resourceType: 'user', description: 'Changed password' },
  { action: 'user.mfa_enabled', resourceType: 'user', description: 'Enabled two-factor authentication' },
  { action: 'user.mfa_disabled', resourceType: 'user', description: 'Disabled two-factor authentication' },
  { action: 'team.member_invited', resourceType: 'invitation', description: 'Invited team member' },
  { action: 'team.member_removed', resourceType: 'member', description: 'Removed team member' },
  { action: 'team.role_changed', resourceType: 'member', description: 'Changed member role' },
  { action: 'connection.created', resourceType: 'connection', description: 'Created data connection' },
  { action: 'connection.updated', resourceType: 'connection', description: 'Updated data connection' },
  { action: 'connection.deleted', resourceType: 'connection', description: 'Deleted data connection' },
  { action: 'widget.created', resourceType: 'widget', description: 'Created widget' },
  { action: 'dashboard.shared', resourceType: 'dashboard', description: 'Shared dashboard' },
  { action: 'api_key.created', resourceType: 'api_key', description: 'Created API key' },
  { action: 'api_key.revoked', resourceType: 'api_key', description: 'Revoked API key' },
];

const BROWSERS = ['Chrome/120.0.0.0', 'Firefox/121.0', 'Safari/17.2', 'Edge/120.0.0.0'];
const OPERATING_SYSTEMS = ['Mac OS X 14.2', 'Windows NT 10.0', 'Ubuntu'];

function generateRandomIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUserAgent(): string {
  const browser = getRandomElement(BROWSERS);
  const os = getRandomElement(OPERATING_SYSTEMS);
  return `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) ${browser}`;
}

function generateMockActivityEntries(): ActivityLogEntry[] {
  const entries: ActivityLogEntry[] = [];
  const mockAuth = getMockAuth();

  // Generate 30-50 activity entries
  const numEntries = 30 + Math.floor(Math.random() * 21);

  for (let i = 0; i < numEntries; i++) {
    const activityType = getRandomElement(ACTIVITY_ACTIONS);
    const createdAt = new Date(
      Date.now() - i * (Math.random() * 8 + 4) * 60 * 60 * 1000
    );

    entries.push({
      id: `activity_${Date.now()}_${i}`,
      action: activityType.action,
      organizationId: mockAuth.domainSignup?.organization?.id || null,
      teamId: null,
      resourceType: activityType.resourceType,
      resourceId: activityType.resourceType ? `${activityType.resourceType}_${i}` : null,
      metadata: generateMetadata(activityType.action),
      ipAddress: generateRandomIP(),
      userAgent: generateUserAgent(),
      createdAt: createdAt.toISOString(),
    });
  }

  return entries;
}

function generateMetadata(action: string): Record<string, unknown> {
  switch (action) {
    case 'user.login':
      return { method: 'magic_link' };
    case 'user.profile_updated':
      return { fields: ['name', 'avatar'] };
    case 'team.member_invited':
      return { email: 'newmember@company.com', role: 'member' };
    case 'team.role_changed':
      return { from: 'member', to: 'admin' };
    case 'connection.created':
      return { type: 'postgresql', name: 'Production DB' };
    default:
      return {};
  }
}

export function getMockActivity(): MockActivityData {
  if (typeof window === 'undefined') {
    return { entries: [], userId: null, initialized: false };
  }

  const data = localStorage.getItem(ACTIVITY_STORAGE_KEY);
  if (!data) {
    return { entries: [], userId: null, initialized: false };
  }

  try {
    return JSON.parse(data);
  } catch {
    return { entries: [], userId: null, initialized: false };
  }
}

export function setMockActivity(data: Partial<MockActivityData>): void {
  if (typeof window === 'undefined') return;
  const current = getMockActivity();
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify({ ...current, ...data }));
}

export function initializeMockActivity(): MockActivityData {
  const existing = getMockActivity();
  const mockAuth = getMockAuth();
  const currentUserId = mockAuth.user?.id || null;

  // Check if activity was initialized for a different user
  if (existing.initialized && currentUserId && existing.userId !== currentUserId) {
    clearMockActivity();
    const mockData: MockActivityData = {
      entries: generateMockActivityEntries(),
      userId: currentUserId,
      initialized: true,
    };
    setMockActivity(mockData);
    return mockData;
  }

  if (existing.initialized) {
    return existing;
  }

  const mockData: MockActivityData = {
    entries: generateMockActivityEntries(),
    userId: currentUserId,
    initialized: true,
  };

  setMockActivity(mockData);
  return mockData;
}

export function clearMockActivity(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACTIVITY_STORAGE_KEY);
}

export function getActivityEntries(
  page: number = 1,
  pageSize: number = 10,
  filterAction?: string
): { entries: ActivityLogEntry[]; hasMore: boolean } {
  const data = getMockActivity();
  let filtered = data.entries;

  if (filterAction && filterAction !== 'all') {
    filtered = filtered.filter((e) => e.action.startsWith(filterAction));
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const entries = filtered.slice(start, end);
  const hasMore = end < filtered.length;

  return { entries, hasMore };
}

// Get unique action categories for filtering
export function getActivityActionCategories(): string[] {
  return ['all', 'user', 'team', 'connection', 'widget', 'dashboard', 'api_key'];
}

// Format action for display
export function formatActivityAction(action: string): string {
  const actionMap: Record<string, string> = {
    'user.login': 'Signed in',
    'user.logout': 'Signed out',
    'user.profile_updated': 'Updated profile',
    'user.password_changed': 'Changed password',
    'user.mfa_enabled': 'Enabled 2FA',
    'user.mfa_disabled': 'Disabled 2FA',
    'team.member_invited': 'Invited team member',
    'team.member_removed': 'Removed team member',
    'team.role_changed': 'Changed member role',
    'connection.created': 'Created connection',
    'connection.updated': 'Updated connection',
    'connection.deleted': 'Deleted connection',
    'widget.created': 'Created widget',
    'dashboard.shared': 'Shared dashboard',
    'api_key.created': 'Created API key',
    'api_key.revoked': 'Revoked API key',
  };
  return actionMap[action] || action;
}
