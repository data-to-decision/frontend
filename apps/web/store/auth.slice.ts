import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  AuthState,
  User,
  DomainSignupResult,
  Organization,
} from '@d2d/types';
import { clearTokens } from '@/lib/auth/tokens';

// Mock data for testing
const MOCK_ORGANIZATIONS: Record<string, Organization> = {
  existingcorp: {
    id: 'org_existingcorp',
    name: 'ExistingCorp',
    slug: 'existingcorp',
    domain: 'existingcorp.com',
    logoUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

// Email domain detection
function isPersonalEmail(email: string): boolean {
  const personalDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'aol.com',
    'protonmail.com',
    'mail.com',
    'live.com',
  ];
  const domain = email.split('@')[1]?.toLowerCase();
  return personalDomains.includes(domain);
}

function getDomainFromEmail(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}

function capitalizeOrgName(domain: string): string {
  // Remove TLD and capitalize
  const name = domain.split('.')[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Determine domain signup action
export function determineDomainAction(email: string): DomainSignupResult {
  const domain = getDomainFromEmail(email);
  const isPersonal = isPersonalEmail(email);

  if (isPersonal) {
    return {
      action: 'none',
      isWorkEmail: false,
      domain: null,
      organization: null,
      joinRequest: null,
    };
  }

  // Check if org exists
  const domainKey = domain.replace('.com', '');
  const existingOrg = MOCK_ORGANIZATIONS[domainKey];

  if (existingOrg) {
    return {
      action: 'join_request_created',
      isWorkEmail: true,
      domain,
      organization: existingOrg,
      joinRequest: {
        id: 'jr_' + Date.now(),
        userId: 'pending',
        organizationId: existingOrg.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  // First user from domain - create org
  const newOrg: Organization = {
    id: 'org_' + domainKey,
    name: capitalizeOrgName(domain),
    slug: domainKey,
    domain,
    logoUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    action: 'organization_created',
    isWorkEmail: true,
    domain,
    organization: newOrg,
    joinRequest: null,
  };
}

const initialState: AuthState = {
  status: 'idle',
  user: null,
  domainSignup: null,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state) => {
      state.status = 'loading';
      state.error = null;
    },
    setDomainSignup: (state, action: PayloadAction<DomainSignupResult>) => {
      state.domainSignup = action.payload;
    },
    setAuthenticated: (state, action: PayloadAction<User>) => {
      state.status = 'authenticated';
      state.user = action.payload;
      state.error = null;
    },
    setUnauthenticated: (state) => {
      state.status = 'unauthenticated';
      state.user = null;
      state.domainSignup = null;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.status = 'unauthenticated';
      state.error = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearDomainSignup: (state) => {
      state.domainSignup = null;
    },
    logout: (state) => {
      state.status = 'unauthenticated';
      state.user = null;
      state.domainSignup = null;
      state.error = null;
      // Clear stored tokens
      clearTokens();
    },
  },
});

export const {
  setLoading,
  setDomainSignup,
  setAuthenticated,
  setUnauthenticated,
  setError,
  updateUser,
  clearDomainSignup,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
