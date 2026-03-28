'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  UserPlus,
  Mail,
  Clock,
  Crown,
  Shield,
  User,
  Check,
  X,
  Send,
  RefreshCw,
  Trash2,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
  Spinner,
} from '@d2d/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import {
  setMembers,
  setInvitations,
  setJoinRequests,
  setLoading,
  setError,
  addInvitation,
  updateMemberRole as updateMemberRoleAction,
  removeMember as removeMemberAction,
  cancelInvitation as cancelInvitationAction,
  removeInvitation,
  removeJoinRequest,
  addMember,
} from '@/store/team.slice';
import {
  initializeMockTeam,
  addTeamInvitation,
  updateMemberRole as updateMockMemberRole,
  removeMember as removeMockMember,
  cancelInvitation as cancelMockInvitation,
  resendInvitation as resendMockInvitation,
  approveJoinRequest as approveMockJoinRequest,
  rejectJoinRequest as rejectMockJoinRequest,
} from '@/lib/mock-team';
import { simulateApiCall, getMockAuth } from '@/lib/mock-auth';
import {
  listMembers,
  inviteMember,
  updateMemberRole as updateMemberRoleApi,
  removeMember as removeMemberApi,
  listInvitations,
  cancelInvitation as cancelInvitationApi,
  resendInvitation as resendInvitationApi,
  listJoinRequests,
  approveJoinRequest as approveJoinRequestApi,
  rejectJoinRequest as rejectJoinRequestApi,
} from '@/lib/api';
import type { OrganizationRole, TeamMember, TeamInvitation, TeamJoinRequest } from '@d2d/types';

// Check if mock auth is enabled
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

const ROLE_OPTIONS: { value: OrganizationRole; label: string; icon: React.ElementType }[] = [
  { value: 'owner', label: 'Owner', icon: Crown },
  { value: 'admin', label: 'Admin', icon: Shield },
  { value: 'member', label: 'Member', icon: User },
];

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['owner', 'admin', 'member']),
});

type InviteForm = z.infer<typeof inviteSchema>;

function RoleBadge({ role }: { role: OrganizationRole }) {
  const config = {
    owner: {
      icon: Crown,
      label: 'Owner',
      className: 'bg-[--color-accent-yellow]/10 text-[--color-accent-yellow] border-[--color-accent-yellow]/20',
    },
    admin: {
      icon: Shield,
      label: 'Admin',
      className: 'bg-[--color-accent-purple]/10 text-[--color-accent-purple] border-[--color-accent-purple]/20',
    },
    member: {
      icon: User,
      label: 'Member',
      className: 'bg-[--color-fill-primary] text-[--color-label-secondary] border-[--color-separator]',
    },
  };

  const { icon: Icon, label, className } = config[role];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function MemberRow({
  member,
  isCurrentUser,
  canManage,
  onRoleChange,
  onRemove,
}: {
  member: TeamMember;
  isCurrentUser: boolean;
  canManage: boolean;
  onRoleChange: (role: OrganizationRole) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRoleChange = async (newRole: OrganizationRole) => {
    setIsChangingRole(true);
    try {
      await onRoleChange(newRole);
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove();
      setShowConfirmRemove(false);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-[--color-separator] last:border-b-0">
      <Avatar size="md">
        {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[--color-label-primary] truncate">
            {member.name}
            {isCurrentUser && (
              <span className="ml-2 text-xs text-[--color-label-tertiary]">(you)</span>
            )}
          </p>
        </div>
        <p className="text-xs text-[--color-label-tertiary] truncate">{member.email}</p>
        {member.jobTitle && (
          <p className="text-xs text-[--color-label-secondary] truncate mt-0.5">{member.jobTitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {canManage && !isCurrentUser && member.role !== 'owner' ? (
          <Select value={member.role} onValueChange={handleRoleChange} disabled={isChangingRole}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              {isChangingRole ? (
                <Spinner size="sm" />
              ) : (
                <SelectValue />
              )}
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.filter((r) => r.value !== 'owner').map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <option.icon className="w-3 h-3" />
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <RoleBadge role={member.role} />
        )}

        <div className="text-xs text-[--color-label-tertiary] w-32 whitespace-nowrap text-right">
          Joined {formatDate(member.joinedAt)}
        </div>

        {canManage && !isCurrentUser && member.role !== 'owner' && (
          <div className="relative">
            {showConfirmRemove ? (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRemove}
                  disabled={isRemoving}
                >
                  {isRemoving ? <Spinner size="sm" /> : <Check className="w-3 h-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="gray"
                  onClick={() => setShowConfirmRemove(false)}
                  disabled={isRemoving}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="gray"
                onClick={() => setShowConfirmRemove(true)}
                className="text-[--color-accent-red] hover:bg-[--color-accent-red]/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InvitationRow({
  invitation,
  onCancel,
  onResend,
}: {
  invitation: TeamInvitation;
  onCancel: () => Promise<void>;
  onResend: () => Promise<void>;
}) {
  const [isResending, setIsResending] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend();
    } finally {
      setIsResending(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancel();
      setShowConfirmCancel(false);
    } finally {
      setIsCancelling(false);
    }
  };

  if (invitation.status === 'cancelled') {
    return null;
  }

  return (
    <div className="flex items-center gap-4 py-4 border-b border-[--color-separator] last:border-b-0">
      <div className="w-10 h-10 rounded-full bg-[--color-fill-primary] flex items-center justify-center">
        <Mail className="w-5 h-5 text-[--color-label-tertiary]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[--color-label-primary] truncate">
          {invitation.email}
        </p>
        <p className="text-xs text-[--color-label-tertiary]">
          Invited by {invitation.invitedByName} - {formatDate(invitation.sentAt)}
        </p>
      </div>

      <RoleBadge role={invitation.role} />

      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[--color-accent-orange]/10 text-[--color-accent-orange] border border-[--color-accent-orange]/20">
        Pending
      </span>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="gray" onClick={handleResend} disabled={isResending}>
          {isResending ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
          <span className="ml-1">Resend</span>
        </Button>

        {showConfirmCancel ? (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? <Spinner size="sm" /> : <Check className="w-3 h-3" />}
            </Button>
            <Button
              size="sm"
              variant="gray"
              onClick={() => setShowConfirmCancel(false)}
              disabled={isCancelling}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="gray"
            onClick={() => setShowConfirmCancel(true)}
            className="text-[--color-accent-red] hover:bg-[--color-accent-red]/10"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function JoinRequestRow({
  request,
  onApprove,
  onReject,
}: {
  request: TeamJoinRequest;
  onApprove: (role: OrganizationRole) => Promise<void>;
  onReject: () => Promise<void>;
}) {
  const [selectedRole, setSelectedRole] = useState<OrganizationRole>('member');
  const [isApproving, setIsApproving] = useState(false);
  const [showConfirmReject, setShowConfirmReject] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(selectedRole);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject();
      setShowConfirmReject(false);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-[--color-fill-primary] border border-[--color-separator]">
      <div className="flex items-start gap-4">
        <Avatar size="md">
          {request.avatarUrl && <AvatarImage src={request.avatarUrl} alt={request.name} />}
          <AvatarFallback>{getInitials(request.name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[--color-label-primary]">{request.name}</p>
          <p className="text-xs text-[--color-label-tertiary]">{request.email}</p>
          <p className="text-xs text-[--color-label-secondary] mt-1">
            <Clock className="w-3 h-3 inline mr-1" />
            Requested {formatDate(request.requestedAt)}
          </p>
          {request.message && (
            <p className="text-sm text-[--color-label-secondary] mt-2 p-2 rounded-lg bg-[--color-background-primary]">
              &quot;{request.message}&quot;
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[--color-separator]">
        <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as OrganizationRole)}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.filter((r) => r.value !== 'owner').map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <option.icon className="w-3 h-3" />
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" variant="filled" onClick={handleApprove} disabled={isApproving}>
          {isApproving ? <Spinner size="sm" /> : <Check className="w-4 h-4" />}
          <span className="ml-1">Approve</span>
        </Button>

        {showConfirmReject ? (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting}
            >
              {isRejecting ? <Spinner size="sm" /> : 'Reject'}
            </Button>
            <Button
              size="sm"
              variant="gray"
              onClick={() => setShowConfirmReject(false)}
              disabled={isRejecting}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="gray"
            onClick={() => setShowConfirmReject(true)}
            className="text-[--color-accent-red] hover:bg-[--color-accent-red]/10"
          >
            <X className="w-4 h-4" />
            <span className="ml-1">Reject</span>
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * No Organization state - shown for personal email users without an organization
 */
function NoOrganizationState() {
  return (
    <Card variant="outlined" padding="lg">
      <CardContent className="!mt-0">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[--color-fill-primary] flex items-center justify-center">
            <Building2 className="w-8 h-8 text-[--color-label-tertiary]" />
          </div>
          <h3 className="text-lg font-semibold text-[--color-label-primary] mb-2">
            No Organization
          </h3>
          <p className="text-sm text-[--color-label-secondary] max-w-md mx-auto mb-6">
            Team management is available for organization members. Create or join an organization to manage your team and collaborate with others.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="filled" size="sm" asChild>
              <a href="/settings/organization">Create Organization</a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeamSettingsPage() {
  const dispatch = useAppDispatch();
  const { members, invitations, joinRequests, isLoading, error } = useAppSelector((state) => state.team);
  const { user } = useAppSelector((state) => state.auth);
  const { currentOrganization } = useAppSelector((state) => state.organization);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [hasNoOrganization, setHasNoOrganization] = useState(false);

  // Use the current organization from Redux store (set by Sidebar)
  const organizationId = currentOrganization?.id || null;

  const mockAuth = getMockAuth();
  const currentUser = user || mockAuth.user;
  const currentUserId = currentUser?.id;

  // Check if current user can manage team (owner or admin)
  const currentMember = members.find((m) => m.userId === currentUserId);
  const canManage = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'member',
    },
  });

  const watchedRole = watch('role');

  // Load team data
  const loadTeamData = useCallback(async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      if (USE_MOCK_AUTH) {
        // Mock mode: use local mock data
        const teamData = initializeMockTeam();
        dispatch(setMembers(teamData.members));
        dispatch(setInvitations(teamData.invitations));
        dispatch(setJoinRequests(teamData.joinRequests));
      } else {
        // Use the current organization from Redux store (set by Sidebar)
        if (!organizationId && currentUser) {
          // Personal workspace - show user as the only "member"
          const personalMember: TeamMember = {
            id: currentUser.id,
            userId: currentUser.id,
            name: currentUser.name || currentUser.displayName || 'You',
            email: currentUser.email,
            role: 'owner',
            jobTitle: null,
            joinedAt: currentUser.createdAt,
            avatarUrl: currentUser.avatarUrl || null,
          };
          dispatch(setMembers([personalMember]));
          dispatch(setInvitations([]));
          dispatch(setJoinRequests([]));
          setHasNoOrganization(false); // Show the member instead of "no org" state
          return;
        }

        if (!organizationId) {
          // No user and no organization - show empty state
          setHasNoOrganization(true);
          dispatch(setMembers([]));
          dispatch(setInvitations([]));
          dispatch(setJoinRequests([]));
          return;
        }

        // Fetch members first - this requires only org membership
        const membersResponse = await listMembers(organizationId);
        dispatch(setMembers(membersResponse.members));

        // Fetch invitations and join requests - these require admin/owner role
        // Handle permission errors gracefully for non-admin users
        try {
          const [invitationsResponse, joinRequestsResponse] = await Promise.all([
            listInvitations(organizationId),
            listJoinRequests(organizationId),
          ]);
          dispatch(setInvitations(invitationsResponse.invitations));
          dispatch(setJoinRequests(joinRequestsResponse.joinRequests));
        } catch (adminErr) {
          // Non-admin users will get 403 for these endpoints - that's expected
          // Just set empty arrays for invitations and join requests
          dispatch(setInvitations([]));
          dispatch(setJoinRequests([]));
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load team data';
      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, organizationId]);

  // Load team data when organization changes
  useEffect(() => {
    // Wait for organization to be loaded from the Sidebar
    if (organizationId || USE_MOCK_AUTH) {
      loadTeamData();
    }
  }, [loadTeamData, organizationId]);

  const onInviteSubmit = async (data: InviteForm) => {
    setInviteError(null);

    try {
      if (USE_MOCK_AUTH) {
        // Mock mode
        await simulateApiCall(null, 800);
        const invitation = addTeamInvitation(data.email, data.role);
        dispatch(addInvitation(invitation));
      } else {
        // API mode
        if (!organizationId) {
          throw new Error('Organization ID not found');
        }

        const response = await inviteMember(organizationId, data.email, data.role);

        // Create a TeamInvitation object from the response
        const invitation: TeamInvitation = {
          id: response.invitation_id,
          email: response.email,
          role: response.role,
          status: 'pending',
          invitedBy: currentUserId || '',
          invitedByName: currentUser?.name || currentUser?.email || 'You',
          sentAt: new Date().toISOString(),
          expiresAt: response.expires_at,
        };

        dispatch(addInvitation(invitation));
      }

      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
      reset();
      setShowInviteForm(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send invitation';
      setInviteError(errorMessage);
    }
  };

  const handleMemberRoleChange = async (memberId: string, userId: string, role: OrganizationRole) => {
    try {
      if (USE_MOCK_AUTH) {
        await simulateApiCall(null, 500);
        updateMockMemberRole(memberId, role);
      } else {
        if (!organizationId) {
          throw new Error('Organization ID not found');
        }
        await updateMemberRoleApi(organizationId, userId, role);
      }
      dispatch(updateMemberRoleAction({ memberId, role }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      dispatch(setError(errorMessage));
    }
  };

  const handleRemoveMember = async (memberId: string, userId: string) => {
    try {
      if (USE_MOCK_AUTH) {
        await simulateApiCall(null, 500);
        removeMockMember(memberId);
      } else {
        if (!organizationId) {
          throw new Error('Organization ID not found');
        }
        await removeMemberApi(organizationId, userId);
      }
      dispatch(removeMemberAction(memberId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
      dispatch(setError(errorMessage));
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      if (USE_MOCK_AUTH) {
        await simulateApiCall(null, 500);
        cancelMockInvitation(invitationId);
        dispatch(cancelInvitationAction(invitationId));
      } else {
        if (!organizationId) {
          throw new Error('Organization ID not found');
        }
        await cancelInvitationApi(organizationId, invitationId);
        // Remove from the list instead of marking as cancelled
        dispatch(removeInvitation(invitationId));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel invitation';
      dispatch(setError(errorMessage));
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      if (USE_MOCK_AUTH) {
        await simulateApiCall(null, 500);
        resendMockInvitation(invitationId);
      } else {
        if (!organizationId) {
          throw new Error('Organization ID not found');
        }
        await resendInvitationApi(organizationId, invitationId);
      }
      // Optionally show success feedback
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend invitation';
      dispatch(setError(errorMessage));
    }
  };

  const handleApproveRequest = async (requestId: string, role: OrganizationRole) => {
    try {
      if (USE_MOCK_AUTH) {
        await simulateApiCall(null, 500);
        const newMember = approveMockJoinRequest(requestId, role);
        if (newMember) {
          dispatch(addMember(newMember));
          dispatch(removeJoinRequest(requestId));
        }
      } else {
        if (!organizationId) {
          throw new Error('Organization ID not found');
        }

        // Approve the request
        await approveJoinRequestApi(organizationId, requestId, role);

        // Find the request to get user info
        const request = joinRequests.find((r) => r.id === requestId);
        if (request) {
          // Create a new member from the request
          const newMember: TeamMember = {
            id: `member_${request.userId}`,
            userId: request.userId,
            name: request.name,
            email: request.email,
            avatarUrl: request.avatarUrl,
            role: role,
            jobTitle: null,
            joinedAt: new Date().toISOString(),
          };
          dispatch(addMember(newMember));
        }
        dispatch(removeJoinRequest(requestId));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve request';
      dispatch(setError(errorMessage));
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      if (USE_MOCK_AUTH) {
        await simulateApiCall(null, 500);
        rejectMockJoinRequest(requestId);
      } else {
        if (!organizationId) {
          throw new Error('Organization ID not found');
        }
        await rejectJoinRequestApi(organizationId, requestId);
      }
      dispatch(removeJoinRequest(requestId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject request';
      dispatch(setError(errorMessage));
    }
  };

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Show no organization state for personal email users
  if (hasNoOrganization) {
    return <NoOrganizationState />;
  }

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && (
        <Card variant="outlined" padding="lg">
          <CardContent className="!mt-0">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[--color-accent-red]/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-[--color-accent-red]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[--color-label-primary]">
                  Error
                </p>
                <p className="text-sm text-[--color-label-secondary] mt-1">
                  {error}
                </p>
              </div>
              <Button size="sm" variant="gray" onClick={loadTeamData}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card variant="outlined" padding="lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {organizationId ? 'Team Members' : 'Personal Workspace'}
              </CardTitle>
              <CardDescription>
                {organizationId
                  ? `${members.length} ${members.length === 1 ? 'member' : 'members'} in your team`
                  : 'Your personal workspace. Create or join an organization to collaborate with others.'
                }
              </CardDescription>
            </div>
            {canManage && organizationId && (
              <Button variant="filled" size="sm" onClick={() => setShowInviteForm(true)}>
                <UserPlus className="w-4 h-4" />
                Invite
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Invite Form */}
          {showInviteForm && (
            <div className="p-4 mb-4 rounded-xl bg-[--color-fill-primary] border border-[--color-separator] animate-slide-down">
              <form onSubmit={handleSubmit(onInviteSubmit)} className="space-y-4">
                {inviteError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[--color-accent-red]/10 text-[--color-accent-red] text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {inviteError}
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      variant={errors.email ? 'error' : 'default'}
                      leftIcon={<Mail className="w-4 h-4" />}
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-[--color-accent-red]">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="w-40 space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={watchedRole}
                      onValueChange={(v) => setValue('role', v as OrganizationRole)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.filter((r) => r.value !== 'owner').map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className="flex items-center gap-2">
                              <option.icon className="w-3 h-3" />
                              {option.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button type="submit" size="sm" isLoading={isSubmitting}>
                    <Send className="w-4 h-4" />
                    Send Invite
                  </Button>
                  <Button
                    type="button"
                    variant="gray"
                    size="sm"
                    onClick={() => {
                      setShowInviteForm(false);
                      setInviteError(null);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Success Message */}
          {inviteSuccess && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-[--color-accent-green]/10 text-[--color-accent-green] text-sm animate-fade-in">
              <Check className="w-4 h-4" />
              Invitation sent successfully
            </div>
          )}

          {/* Members List */}
          <div className="divide-y divide-[--color-separator]">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isCurrentUser={member.userId === currentUserId}
                canManage={canManage}
                onRoleChange={(role) => handleMemberRoleChange(member.id, member.userId, role)}
                onRemove={() => handleRemoveMember(member.id, member.userId)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {canManage && pendingInvitations.length > 0 && (
        <Card variant="outlined" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              {pendingInvitations.length} pending{' '}
              {pendingInvitations.length === 1 ? 'invitation' : 'invitations'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="divide-y divide-[--color-separator]">
              {pendingInvitations.map((invitation) => (
                <InvitationRow
                  key={invitation.id}
                  invitation={invitation}
                  onCancel={() => handleCancelInvitation(invitation.id)}
                  onResend={() => handleResendInvitation(invitation.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Join Requests */}
      {canManage && joinRequests.length > 0 && (
        <Card variant="outlined" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Join Requests
            </CardTitle>
            <CardDescription>
              {joinRequests.length} {joinRequests.length === 1 ? 'person' : 'people'} requesting to
              join
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {joinRequests.map((request) => (
                <JoinRequestRow
                  key={request.id}
                  request={request}
                  onApprove={(role) => handleApproveRequest(request.id, role)}
                  onReject={() => handleRejectRequest(request.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State for Join Requests */}
      {canManage && joinRequests.length === 0 && pendingInvitations.length === 0 && (
        <div className="text-center p-8 rounded-xl bg-[--color-fill-primary] border border-[--color-separator]">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[--color-background-secondary] flex items-center justify-center">
            <Users className="w-6 h-6 text-[--color-label-tertiary]" />
          </div>
          <h3 className="text-sm font-medium text-[--color-label-primary] mb-1">
            No pending requests
          </h3>
          <p className="text-xs text-[--color-label-tertiary]">
            Invite team members to collaborate on your workspace
          </p>
        </div>
      )}
    </div>
  );
}
