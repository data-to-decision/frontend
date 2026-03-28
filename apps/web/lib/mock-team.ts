import type {
  TeamMember,
  TeamInvitation,
  TeamJoinRequest,
  OrganizationRole,
} from '@d2d/types';
import { getMockAuth } from './mock-auth';

const TEAM_STORAGE_KEY = 'd2d_mock_team';

export interface MockTeamData {
  members: TeamMember[];
  invitations: TeamInvitation[];
  joinRequests: TeamJoinRequest[];
  initialized: boolean;
}

// Generate mock team members
function generateMockMembers(): TeamMember[] {
  const mockAuth = getMockAuth();
  const currentUser = mockAuth.user;

  const members: TeamMember[] = [];

  // Add current user as owner if they exist
  if (currentUser) {
    members.push({
      id: 'member_' + currentUser.id,
      userId: currentUser.id,
      name: currentUser.name || 'You',
      email: currentUser.email,
      avatarUrl: currentUser.avatarUrl,
      role: 'owner',
      jobTitle: 'CEO / Founder',
      joinedAt: currentUser.createdAt,
    });
  }

  // Add mock team members
  const mockMembers: Omit<TeamMember, 'id'>[] = [
    {
      userId: 'user_sarah',
      name: 'Sarah Chen',
      email: 'sarah.chen@company.com',
      avatarUrl: null,
      role: 'admin',
      jobTitle: 'VP of Engineering',
      joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: 'user_marcus',
      name: 'Marcus Johnson',
      email: 'marcus.j@company.com',
      avatarUrl: null,
      role: 'member',
      jobTitle: 'Data Analyst',
      joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: 'user_elena',
      name: 'Elena Rodriguez',
      email: 'elena.r@company.com',
      avatarUrl: null,
      role: 'member',
      jobTitle: 'Product Manager',
      joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  mockMembers.forEach((member, index) => {
    members.push({
      ...member,
      id: 'member_' + (index + 2),
    });
  });

  return members;
}

// Generate mock invitations
function generateMockInvitations(): TeamInvitation[] {
  const mockAuth = getMockAuth();
  const currentUserName = mockAuth.user?.name || 'You';

  return [
    {
      id: 'inv_1',
      email: 'alex.kim@company.com',
      role: 'member',
      status: 'pending',
      invitedBy: mockAuth.user?.id || 'user_1',
      invitedByName: currentUserName,
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'inv_2',
      email: 'jordan.smith@company.com',
      role: 'admin',
      status: 'pending',
      invitedBy: mockAuth.user?.id || 'user_1',
      invitedByName: currentUserName,
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

// Generate mock join requests
function generateMockJoinRequests(): TeamJoinRequest[] {
  return [
    {
      id: 'jr_1',
      userId: 'user_pending_1',
      name: 'David Park',
      email: 'david.park@company.com',
      avatarUrl: null,
      requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      message: 'I work in the finance team and would like to access the dashboards.',
    },
    {
      id: 'jr_2',
      userId: 'user_pending_2',
      name: 'Priya Sharma',
      email: 'priya.s@company.com',
      avatarUrl: null,
      requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      message: null,
    },
  ];
}

export function getMockTeam(): MockTeamData {
  if (typeof window === 'undefined') {
    return { members: [], invitations: [], joinRequests: [], initialized: false };
  }

  const data = localStorage.getItem(TEAM_STORAGE_KEY);
  if (!data) {
    return { members: [], invitations: [], joinRequests: [], initialized: false };
  }

  try {
    return JSON.parse(data);
  } catch {
    return { members: [], invitations: [], joinRequests: [], initialized: false };
  }
}

export function setMockTeam(data: Partial<MockTeamData>): void {
  if (typeof window === 'undefined') return;
  const current = getMockTeam();
  localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify({ ...current, ...data }));
}

export function initializeMockTeam(): MockTeamData {
  const existing = getMockTeam();
  const mockAuth = getMockAuth();
  const currentUser = mockAuth.user;

  // Check if team was initialized for a different user
  // If so, re-initialize with the current user
  if (existing.initialized && currentUser) {
    const memberByUserId = existing.members.find((m) => m.userId === currentUser.id);
    const memberByEmail = existing.members.find((m) => m.email === currentUser.email);

    if (!memberByUserId && !memberByEmail) {
      // Completely different user logged in, re-initialize
      clearMockTeam();
      const mockData: MockTeamData = {
        members: generateMockMembers(),
        invitations: generateMockInvitations(),
        joinRequests: generateMockJoinRequests(),
        initialized: true,
      };
      setMockTeam(mockData);
      return mockData;
    }

    // Same user but different session (new userId) - update the userId
    if (!memberByUserId && memberByEmail) {
      memberByEmail.userId = currentUser.id;
      memberByEmail.id = 'member_' + currentUser.id;
      // Also update name if it changed
      if (currentUser.name) {
        memberByEmail.name = currentUser.name;
      }
      if (currentUser.avatarUrl) {
        memberByEmail.avatarUrl = currentUser.avatarUrl;
      }
      setMockTeam(existing);
    }

    return existing;
  }

  if (existing.initialized) {
    return existing;
  }

  const mockData: MockTeamData = {
    members: generateMockMembers(),
    invitations: generateMockInvitations(),
    joinRequests: generateMockJoinRequests(),
    initialized: true,
  };

  setMockTeam(mockData);
  return mockData;
}

export function clearMockTeam(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TEAM_STORAGE_KEY);
}

// Helper functions for team operations
export function addTeamInvitation(
  email: string,
  role: OrganizationRole
): TeamInvitation {
  const mockAuth = getMockAuth();
  const invitation: TeamInvitation = {
    id: 'inv_' + Date.now(),
    email,
    role,
    status: 'pending',
    invitedBy: mockAuth.user?.id || 'user_1',
    invitedByName: mockAuth.user?.name || 'You',
    sentAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const team = getMockTeam();
  team.invitations.push(invitation);
  setMockTeam(team);

  return invitation;
}

export function approveJoinRequest(
  requestId: string,
  role: OrganizationRole
): TeamMember | null {
  const team = getMockTeam();
  const request = team.joinRequests.find((r) => r.id === requestId);

  if (!request) return null;

  const newMember: TeamMember = {
    id: 'member_' + Date.now(),
    userId: request.userId,
    name: request.name,
    email: request.email,
    avatarUrl: request.avatarUrl,
    role,
    jobTitle: null,
    joinedAt: new Date().toISOString(),
  };

  team.members.push(newMember);
  team.joinRequests = team.joinRequests.filter((r) => r.id !== requestId);
  setMockTeam(team);

  return newMember;
}

export function rejectJoinRequest(requestId: string): void {
  const team = getMockTeam();
  team.joinRequests = team.joinRequests.filter((r) => r.id !== requestId);
  setMockTeam(team);
}

export function updateMemberRole(memberId: string, role: OrganizationRole): void {
  const team = getMockTeam();
  const member = team.members.find((m) => m.id === memberId);
  if (member) {
    member.role = role;
    setMockTeam(team);
  }
}

export function removeMember(memberId: string): void {
  const team = getMockTeam();
  team.members = team.members.filter((m) => m.id !== memberId);
  setMockTeam(team);
}

export function cancelInvitation(invitationId: string): void {
  const team = getMockTeam();
  const invitation = team.invitations.find((i) => i.id === invitationId);
  if (invitation) {
    invitation.status = 'cancelled';
    setMockTeam(team);
  }
}

export function resendInvitation(invitationId: string): void {
  const team = getMockTeam();
  const invitation = team.invitations.find((i) => i.id === invitationId);
  if (invitation) {
    invitation.sentAt = new Date().toISOString();
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    setMockTeam(team);
  }
}
