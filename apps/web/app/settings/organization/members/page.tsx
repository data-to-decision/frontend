'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Crown,
  Shield,
  User,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import {
  Button,
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
  Spinner,
} from '@d2d/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import {
  setMembers,
  updateMemberRole as updateMemberRoleAction,
  removeMember as removeMemberAction,
} from '@/store/organization.slice';
import {
  listMembers,
  updateMemberRole as updateMemberRoleApi,
  removeMember as removeMemberApi,
} from '@/lib/api';
import type { OrganizationRole, OrganizationMember } from '@d2d/types';

const ROLE_OPTIONS: { value: OrganizationRole; label: string; icon: React.ElementType }[] = [
  { value: 'owner', label: 'Owner', icon: Crown },
  { value: 'admin', label: 'Admin', icon: Shield },
  { value: 'member', label: 'Member', icon: User },
];

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
  member: OrganizationMember;
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

/**
 * No Organization state - shown when user has no organization
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
          <p className="text-sm text-[--color-label-secondary] max-w-md mx-auto">
            You are not currently part of any organization.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrganizationMembersPage() {
  const dispatch = useAppDispatch();
  const { members, currentOrganization } = useAppSelector((state) => state.organization);
  const { user } = useAppSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = user?.id;
  const organizationId = currentOrganization?.id || null;

  // Check if current user can manage members (owner or admin)
  const currentMember = members.find((m) => m.userId === currentUserId);
  const canManage = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  // Load members data
  const loadMembers = useCallback(async () => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await listMembers(organizationId);
      // Transform TeamMember to OrganizationMember (they're compatible)
      const orgMembers: OrganizationMember[] = response.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.name,
        email: m.email,
        avatarUrl: m.avatarUrl,
        role: m.role,
        joinedAt: m.joinedAt,
      }));
      dispatch(setMembers(orgMembers));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load members';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, organizationId]);

  // Load members when organization is available
  useEffect(() => {
    if (organizationId) {
      loadMembers();
    } else {
      setIsLoading(false);
    }
  }, [loadMembers, organizationId]);

  const handleMemberRoleChange = async (memberId: string, userId: string, role: OrganizationRole) => {
    if (!organizationId) return;

    try {
      await updateMemberRoleApi(organizationId, userId, role);
      dispatch(updateMemberRoleAction({ memberId, role }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      setError(errorMessage);
    }
  };

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (!organizationId) return;

    try {
      await removeMemberApi(organizationId, userId);
      dispatch(removeMemberAction(memberId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
      setError(errorMessage);
    }
  };

  // Separate owners from other members
  const owners = members.filter((m) => m.role === 'owner');
  const admins = members.filter((m) => m.role === 'admin');
  const regularMembers = members.filter((m) => m.role === 'member');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Show no organization state
  if (!organizationId) {
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
                <p className="text-sm font-medium text-[--color-label-primary]">Error</p>
                <p className="text-sm text-[--color-label-secondary] mt-1">{error}</p>
              </div>
              <Button size="sm" variant="gray" onClick={loadMembers}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card variant="outlined" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Organization Members
          </CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? 'member' : 'members'} in your organization
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Owners */}
          {owners.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-medium text-[--color-label-tertiary] uppercase tracking-wider mb-3">
                Owners
              </h4>
              <div className="space-y-0 divide-y divide-[--color-separator] border border-[--color-separator] rounded-xl overflow-hidden">
                {owners.map((member) => (
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
            </div>
          )}

          {/* Admins */}
          {admins.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-medium text-[--color-label-tertiary] uppercase tracking-wider mb-3">
                Admins
              </h4>
              <div className="space-y-0 divide-y divide-[--color-separator] border border-[--color-separator] rounded-xl overflow-hidden">
                {admins.map((member) => (
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
            </div>
          )}

          {/* Members */}
          {regularMembers.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-[--color-label-tertiary] uppercase tracking-wider mb-3">
                Members
              </h4>
              <div className="space-y-0 divide-y divide-[--color-separator] border border-[--color-separator] rounded-xl overflow-hidden">
                {regularMembers.map((member) => (
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
            </div>
          )}

          {members.length === 0 && (
            <div className="text-center p-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[--color-fill-primary] flex items-center justify-center">
                <Users className="w-6 h-6 text-[--color-label-tertiary]" />
              </div>
              <p className="text-sm text-[--color-label-tertiary]">
                No members found
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
