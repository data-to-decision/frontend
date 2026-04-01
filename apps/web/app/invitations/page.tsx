'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Mail,
  ArrowRight,
  Clock,
  ArrowLeft,
  Inbox,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Avatar,
  AvatarFallback,
  Spinner,
} from '@d2d/ui';
import { useAppSelector, useAppDispatch } from '@/hooks/useStore';
import { setOrganizations, setCurrentOrganization } from '@/store/organization.slice';
import {
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,
  listUserOrganizations,
  ApiError,
} from '@/lib/api';
import type { PendingInvitation } from '@/lib/api';

// LocalStorage key for selected organization
const SELECTED_ORG_KEY = 'd2d_selected_org';

type InvitationAction = {
  id: string;
  type: 'accepting' | 'declining';
};

export default function InvitationsListPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Get auth state from Redux
  const authStatus = useAppSelector((state) => state.auth.status);
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAuthenticated = authStatus === 'authenticated' && currentUser !== null;
  const isAuthLoading = authStatus === 'idle' || authStatus === 'loading';

  const [isLoading, setIsLoading] = useState(true);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<InvitationAction | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch pending invitations
  const fetchInvitations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const pending = await getPendingInvitations();
      setInvitations(pending);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.userMessage);
      } else {
        setError('Failed to load invitations. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInvitations();
    } else if (!isAuthLoading) {
      // Redirect to login if not authenticated
      const returnUrl = encodeURIComponent('/invitations');
      router.push(`/login?returnUrl=${returnUrl}`);
    }
  }, [isAuthenticated, isAuthLoading, fetchInvitations, router]);

  const handleAccept = async (invitation: PendingInvitation) => {
    setActionInProgress({ id: invitation.id, type: 'accepting' });
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await acceptInvitation(invitation.token);

      // Fetch updated organizations list and set the new one as current
      try {
        const orgs = await listUserOrganizations();
        const orgList = orgs.map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
          logoUrl: org.logoUrl,
          domain: null,
          createdAt: org.createdAt,
          updatedAt: org.createdAt,
        }));
        dispatch(setOrganizations(orgList));

        const newOrgId = result.organizationId || invitation.organizationId;
        if (newOrgId) {
          const newOrg = orgList.find((o) => o.id === newOrgId);
          if (newOrg) {
            dispatch(setCurrentOrganization(newOrg));
            localStorage.setItem(SELECTED_ORG_KEY, newOrg.id);
          }
        }
      } catch (err) {
        console.error('Failed to refresh organizations:', err);
      }

      setSuccessMessage(`You've joined ${invitation.organizationName}!`);

      // Remove the accepted invitation from the list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.userMessage);
      } else {
        setError('Failed to accept invitation. Please try again.');
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDecline = async (invitation: PendingInvitation) => {
    setActionInProgress({ id: invitation.id, type: 'declining' });
    setError(null);
    setSuccessMessage(null);

    try {
      await declineInvitation(invitation.token);

      // Remove the declined invitation from the list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
      setSuccessMessage(`Invitation to ${invitation.organizationName} declined.`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.userMessage);
      } else {
        setError('Failed to decline invitation. Please try again.');
      }
    } finally {
      setActionInProgress(null);
    }
  };

  // Format expiration date
  const formatExpiresAt = (expiresAt: string): string => {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 1) {
      return `Expires in ${diffDays} days`;
    } else if (diffHours > 1) {
      return `Expires in ${diffHours} hours`;
    } else if (diffHours === 1) {
      return 'Expires in 1 hour';
    } else if (diffMs > 0) {
      return 'Expires soon';
    } else {
      return 'Expired';
    }
  };

  // Capitalize role for display
  const formatRole = (role: string): string => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Loading state
  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--color-background-secondary] p-8">
        <div className="w-full max-w-2xl">
          <Card variant="elevated" padding="lg">
            <CardContent className="flex flex-col items-center py-8">
              <Spinner size="lg" />
              <p className="mt-4 text-sm text-[--color-label-secondary]">
                Loading invitations...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Empty state
  if (invitations.length === 0 && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--color-background-secondary] p-8">
        <div className="w-full max-w-2xl">
          <Card variant="elevated" padding="lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-[--color-fill-secondary] flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-[--color-label-tertiary]" />
              </div>
              <CardTitle className="text-2xl">No pending invitations</CardTitle>
              <CardDescription className="mt-2">
                {successMessage || "You don't have any pending invitations at the moment."}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => router.push('/')} variant="outline" fullWidth>
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--color-background-secondary] p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[--color-label-secondary] hover:text-[--color-label-primary] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[--color-accent-blue]/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-[--color-accent-blue]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[--color-label-primary]">
                Pending Invitations
              </h1>
              <p className="text-sm text-[--color-label-secondary]">
                {invitations.length} invitation{invitations.length !== 1 ? 's' : ''} waiting for your response
              </p>
            </div>
          </div>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="mb-4 p-4 rounded-xl bg-[--color-accent-green]/10 text-[--color-accent-green] flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm">{successMessage}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-[--color-accent-red]/10 text-[--color-accent-red]">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Invitations list */}
        <div className="space-y-4">
          {invitations.map((invitation) => {
            const isAccepting = actionInProgress?.id === invitation.id && actionInProgress.type === 'accepting';
            const isDeclining = actionInProgress?.id === invitation.id && actionInProgress.type === 'declining';
            const isDisabled = actionInProgress !== null;

            return (
              <Card key={invitation.id} variant="elevated" padding="lg">
                <CardContent className="space-y-4">
                  {/* Inviter info */}
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      <AvatarFallback>
                        {invitation.invitedByName
                          ? getInitials(invitation.invitedByName)
                          : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-[--color-label-primary]">
                        <span className="font-medium">{invitation.invitedByName}</span>{' '}
                        invited you to join
                      </p>
                      <p className="text-xs text-[--color-label-tertiary]">
                        Sent to {invitation.email}
                      </p>
                    </div>
                  </div>

                  {/* Organization/Team info */}
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-[--color-fill-primary] border border-[--color-separator]">
                    <Avatar size="lg">
                      <AvatarFallback className="bg-[--color-accent-indigo]">
                        {invitation.type === 'team' ? (
                          <Users className="w-6 h-6 text-white" />
                        ) : (
                          <Building2 className="w-6 h-6 text-white" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[--color-label-primary] truncate">
                        {invitation.organizationName}
                      </h3>
                      {invitation.teamName && (
                        <p className="text-sm text-[--color-label-secondary] truncate">
                          Team: {invitation.teamName}
                        </p>
                      )}
                      <p className="text-sm text-[--color-label-secondary]">
                        Role: <span className="font-medium">{formatRole(invitation.role)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Expiration info */}
                  <div className="flex items-center gap-2 text-xs text-[--color-label-tertiary]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatExpiresAt(invitation.expiresAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAccept(invitation)}
                      className="flex-1"
                      isLoading={isAccepting}
                      disabled={isDisabled}
                    >
                      Accept
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDecline(invitation)}
                      variant="outline"
                      className="flex-1"
                      isLoading={isDeclining}
                      disabled={isDisabled}
                    >
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
