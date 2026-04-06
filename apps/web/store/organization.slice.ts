import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  OrganizationState,
  Organization,
  OrganizationMember,
  OrganizationSettings,
  AuditLogEntry,
  OrganizationRole,
} from '@d2d/types';

const initialState: OrganizationState = {
  organizations: [],
  currentOrganization: null,
  currentUserRole: null,
  members: [],
  settings: null,
  auditLog: [],
  auditLogHasMore: true,
  isLoading: false,
  error: null,
};

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setOrganizations: (state, action: PayloadAction<Organization[]>) => {
      state.organizations = action.payload;
    },
    setCurrentOrganization: (state, action: PayloadAction<Organization | null>) => {
      state.currentOrganization = action.payload;
    },
    setCurrentUserRole: (state, action: PayloadAction<OrganizationRole | null>) => {
      state.currentUserRole = action.payload;
    },
    updateOrganization: (state, action: PayloadAction<Partial<Organization>>) => {
      if (state.currentOrganization) {
        state.currentOrganization = { ...state.currentOrganization, ...action.payload };
      }
      const index = state.organizations.findIndex(
        (o) => o.id === state.currentOrganization?.id
      );
      if (index !== -1) {
        state.organizations[index] = { ...state.organizations[index], ...action.payload };
      }
    },
    deleteOrganization: (state, action: PayloadAction<string>) => {
      state.organizations = state.organizations.filter((o) => o.id !== action.payload);
      if (state.currentOrganization?.id === action.payload) {
        state.currentOrganization = null;
      }
    },
    setMembers: (state, action: PayloadAction<OrganizationMember[]>) => {
      state.members = action.payload;
    },
    updateMemberRole: (
      state,
      action: PayloadAction<{ memberId: string; role: OrganizationRole }>
    ) => {
      const member = state.members.find((m) => m.id === action.payload.memberId);
      if (member) {
        member.role = action.payload.role;
      }
    },
    removeMember: (state, action: PayloadAction<string>) => {
      state.members = state.members.filter((m) => m.id !== action.payload);
    },
    setSettings: (state, action: PayloadAction<OrganizationSettings | null>) => {
      state.settings = action.payload;
    },
    updateSettings: (state, action: PayloadAction<Partial<OrganizationSettings>>) => {
      if (state.settings) {
        state.settings = { ...state.settings, ...action.payload };
      }
    },
    setAuditLog: (state, action: PayloadAction<AuditLogEntry[]>) => {
      state.auditLog = action.payload;
    },
    appendAuditLog: (state, action: PayloadAction<AuditLogEntry[]>) => {
      state.auditLog = [...state.auditLog, ...action.payload];
    },
    setAuditLogHasMore: (state, action: PayloadAction<boolean>) => {
      state.auditLogHasMore = action.payload;
    },
    resetOrganization: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  setOrganizations,
  setCurrentOrganization,
  setCurrentUserRole,
  updateOrganization,
  deleteOrganization,
  setMembers,
  updateMemberRole,
  removeMember,
  setSettings,
  updateSettings,
  setAuditLog,
  appendAuditLog,
  setAuditLogHasMore,
  resetOrganization,
} = organizationSlice.actions;

export default organizationSlice.reducer;
