import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  TeamState,
  TeamMember,
  TeamInvitation,
  TeamJoinRequest,
  OrganizationRole,
} from '@d2d/types';

const initialState: TeamState = {
  members: [],
  invitations: [],
  joinRequests: [],
  isLoading: false,
  error: null,
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setMembers: (state, action: PayloadAction<TeamMember[]>) => {
      state.members = action.payload;
    },
    addMember: (state, action: PayloadAction<TeamMember>) => {
      state.members.push(action.payload);
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
    setInvitations: (state, action: PayloadAction<TeamInvitation[]>) => {
      state.invitations = action.payload;
    },
    addInvitation: (state, action: PayloadAction<TeamInvitation>) => {
      state.invitations.push(action.payload);
    },
    updateInvitation: (state, action: PayloadAction<TeamInvitation>) => {
      const index = state.invitations.findIndex((i) => i.id === action.payload.id);
      if (index !== -1) {
        state.invitations[index] = action.payload;
      }
    },
    cancelInvitation: (state, action: PayloadAction<string>) => {
      const invitation = state.invitations.find((i) => i.id === action.payload);
      if (invitation) {
        invitation.status = 'cancelled';
      }
    },
    removeInvitation: (state, action: PayloadAction<string>) => {
      state.invitations = state.invitations.filter((i) => i.id !== action.payload);
    },
    setJoinRequests: (state, action: PayloadAction<TeamJoinRequest[]>) => {
      state.joinRequests = action.payload;
    },
    addJoinRequest: (state, action: PayloadAction<TeamJoinRequest>) => {
      state.joinRequests.push(action.payload);
    },
    removeJoinRequest: (state, action: PayloadAction<string>) => {
      state.joinRequests = state.joinRequests.filter((r) => r.id !== action.payload);
    },
    resetTeam: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  setMembers,
  addMember,
  updateMemberRole,
  removeMember,
  setInvitations,
  addInvitation,
  updateInvitation,
  cancelInvitation,
  removeInvitation,
  setJoinRequests,
  addJoinRequest,
  removeJoinRequest,
  resetTeam,
} = teamSlice.actions;

export default teamSlice.reducer;
