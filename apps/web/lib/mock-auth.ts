import type { User, DomainSignupResult } from '@d2d/types';

const STORAGE_KEY = 'd2d_mock_auth';

export interface MockAuthData {
  user: User | null;
  email: string | null;
  domainSignup: DomainSignupResult | null;
  returnUrl: string | null;
}

const DEFAULT_MOCK_AUTH: MockAuthData = { user: null, email: null, domainSignup: null, returnUrl: null };

/**
 * Validate that the parsed data has the expected MockAuthData structure
 * Returns true if the data is valid, false otherwise
 */
function isValidMockAuthData(data: unknown): data is MockAuthData {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  // Check that all expected keys exist (they can be null)
  // returnUrl is optional for backwards compatibility
  if (!('user' in obj) || !('email' in obj) || !('domainSignup' in obj)) {
    return false;
  }

  // Validate returnUrl if present
  if ('returnUrl' in obj && obj.returnUrl !== null && typeof obj.returnUrl !== 'string') {
    return false;
  }

  // Validate user if present
  if (obj.user !== null) {
    if (typeof obj.user !== 'object') return false;
    const user = obj.user as Record<string, unknown>;
    // Check required user properties
    if (typeof user.id !== 'string' || typeof user.email !== 'string') {
      return false;
    }
  }

  // Validate email if present
  if (obj.email !== null && typeof obj.email !== 'string') {
    return false;
  }

  // Validate domainSignup if present
  if (obj.domainSignup !== null) {
    if (typeof obj.domainSignup !== 'object') return false;
    const ds = obj.domainSignup as Record<string, unknown>;
    // Check required domainSignup properties
    if (!('action' in ds) || !('isWorkEmail' in ds)) {
      return false;
    }
  }

  return true;
}

export function getMockAuth(): MockAuthData {
  if (typeof window === 'undefined') {
    return DEFAULT_MOCK_AUTH;
  }
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return DEFAULT_MOCK_AUTH;
  }
  try {
    const parsed = JSON.parse(data);
    if (!isValidMockAuthData(parsed)) {
      console.warn('Invalid mock auth data in localStorage, clearing...');
      localStorage.removeItem(STORAGE_KEY);
      return DEFAULT_MOCK_AUTH;
    }
    return parsed;
  } catch {
    return DEFAULT_MOCK_AUTH;
  }
}

export function setMockAuth(data: Partial<MockAuthData>): void {
  if (typeof window === 'undefined') return;
  const current = getMockAuth();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...data }));
}

export function clearMockAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function createMockUser(
  email: string,
  domainSignup: DomainSignupResult
): User {
  // Determine onboarding status based on domain signup action
  // New users always start with pending_profile
  // After profile completion, work email users go to pending_org if they created an org
  const onboardingStatus = 'pending_profile' as const;

  return {
    id: 'user_' + Date.now(),
    email,
    name: null,
    displayName: null,
    avatarUrl: null,
    timezone: null,
    role: 'user',
    organizationId: domainSignup.organization?.id || null,
    organizationRole: domainSignup.action === 'organization_created' ? 'owner' : 'member',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    onboardingComplete: false,
    onboardingStatus,
  };
}

// Simulate magic link verification delay
export async function simulateVerification(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1500));
}

// Simulate API call delay
export async function simulateApiCall<T>(data: T, delay = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
}
// Force rebuild Thu Apr  2 03:37:36 IST 2026
