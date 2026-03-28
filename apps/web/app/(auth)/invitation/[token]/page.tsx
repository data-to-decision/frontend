'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Mail,
  ArrowRight,
  Clock,
  AlertCircle,
  LogIn,
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
import { useAppSelector } from '@/hooks/useStore';
import {
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,
  ApiError,
} from '@/lib/api';
import type { InvitationDetails } from '@/lib/api';

type PageState =
  | 'loading'
  | 'valid'
  | 'expired'
  | 'already_accepted'
  | 'already_declined'
  | 'invalid'
  | 'error'
  | 'accepting'
  | 'accepted'
  | 'declining'
  | 'declined';

export default function InvitationPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  // Get auth state from Redux
  const authStatus = useAppSelector((state) => state.auth.status);
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAuthenticated = authStatus === 'authenticated' && currentUser !== null;
  const isAuthLoading = authStatus === 'idle' || authStatus === 'loading';

  const [state, setState] = useState<PageState>('loading');
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch invitation details on mount
  const fetchInvitation = useCallback(async () => {
    setState('loading');
    setErrorMessage(null);

    try {
      const data = await getInvitationByToken(token);
      setInvitation(data);

      // Determine state based on invitation status
      if (data.isExpired || data.status === 'expired') {
        setState('expired');
      } else if (data.status === 'accepted') {
        setState('already_accepted');
      } else if (data.status === 'declined') {
        setState('already_declined');
      } else if (data.status === 'cancelled') {
        setState('invalid');
        setErrorMessage('This invitation has been cancelled.');
      } else {
        setState('valid');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.statusCode === 404) {
          setState('invalid');
          setErrorMessage('This invitation link is invalid or does not exist.');
        } else if (error.code === 'TOKEN_EXPIRED') {
          setState('expired');
        } else {
          setState('error');
          setErrorMessage(error.userMessage);
        }
      } else {
        setState('error');
        setErrorMessage('Something went wrong. Please try again.');
      }
    }
  }, [token]);

  useEffect(() => {
    fetchInvitation();
  }, [fetchInvitation]);

  const handleAccept = async () => {
    setState('accepting');
    setErrorMessage(null);

    try {
      await acceptInvitation(token);
      setState('accepted');

      // Redirect to dashboard after delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.userMessage);

        // Handle specific error cases
        if (error.statusCode === 401) {
          // User was logged out during the process
          setState('valid');
        } else if (error.code === 'EMAIL_MISMATCH') {
          setState('valid');
          setErrorMessage(
            'You must be logged in with the email address this invitation was sent to.'
          );
        } else if (error.code === 'TOKEN_EXPIRED') {
          setState('expired');
        } else if (error.code === 'ALREADY_ACCEPTED') {
          setState('already_accepted');
        } else {
          setState('valid');
        }
      } else {
        setState('valid');
        setErrorMessage('Failed to accept invitation. Please try again.');
      }
    }
  };

  const handleDecline = async () => {
    setState('declining');
    setErrorMessage(null);

    try {
      await declineInvitation(token);
      setState('declined');

      // Redirect to home after delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.userMessage);
        setState('valid');
      } else {
        setState('valid');
        setErrorMessage('Failed to decline invitation. Please try again.');
      }
    }
  };

  const handleLoginToAccept = () => {
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(`/invitation/${token}`);
    router.push(`/login?returnUrl=${returnUrl}`);
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
  if (state === 'loading' || isAuthLoading) {
    return (
      <Card variant="elevated" padding="lg">
        <CardContent className="flex flex-col items-center py-8">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-[--color-label-secondary]">
            Loading invitation...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Expired state
  if (state === 'expired') {
    return (
      <Card variant="elevated" padding="lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[--color-accent-orange]/10 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-[--color-accent-orange]" />
          </div>
          <CardTitle className="text-2xl">Invitation expired</CardTitle>
          <CardDescription className="mt-2">
            This invitation link has expired. Please ask{' '}
            {invitation?.invitedByName || 'the organization admin'} to send you a
            new invitation.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push('/login')} variant="outline" fullWidth>
            Go to sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Already accepted state
  if (state === 'already_accepted') {
    return (
      <Card variant="elevated" padding="lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[--color-accent-blue]/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-[--color-accent-blue]" />
          </div>
          <CardTitle className="text-2xl">Already accepted</CardTitle>
          <CardDescription className="mt-2">
            This invitation has already been accepted. Sign in to access your
            workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push('/login')} fullWidth>
            Sign in
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Already declined state
  if (state === 'already_declined') {
    return (
      <Card variant="elevated" padding="lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[--color-fill-secondary] flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-[--color-label-tertiary]" />
          </div>
          <CardTitle className="text-2xl">Invitation declined</CardTitle>
          <CardDescription className="mt-2">
            This invitation was previously declined. Contact{' '}
            {invitation?.invitedByName || 'the organization admin'} if you&apos;d
            like to receive a new invitation.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push('/login')} variant="outline" fullWidth>
            Go to sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Invalid/error state
  if (state === 'invalid' || state === 'error') {
    return (
      <Card variant="elevated" padding="lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[--color-accent-red]/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-[--color-accent-red]" />
          </div>
          <CardTitle className="text-2xl">
            {state === 'invalid' ? 'Invalid invitation' : 'Something went wrong'}
          </CardTitle>
          <CardDescription className="mt-2">
            {errorMessage || 'This invitation link is not valid.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={() => router.push('/login')} variant="outline" fullWidth>
            Go to sign in
          </Button>
          {state === 'error' && (
            <Button onClick={fetchInvitation} variant="plain" fullWidth>
              Try again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Successfully accepted state
  if (state === 'accepted') {
    return (
      <Card variant="elevated" padding="lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[--color-accent-green]/10 flex items-center justify-center mb-4 animate-scale-in">
            <CheckCircle2 className="w-8 h-8 text-[--color-accent-green]" />
          </div>
          <CardTitle className="text-2xl">Welcome aboard!</CardTitle>
          <CardDescription className="mt-2">
            You&apos;ve joined {invitation?.organizationName}
            {invitation?.teamName ? ` (${invitation.teamName})` : ''}. Setting up
            your access...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <Spinner size="sm" />
          <span className="ml-2 text-sm text-[--color-label-secondary]">
            Redirecting...
          </span>
        </CardContent>
      </Card>
    );
  }

  // Successfully declined state
  if (state === 'declined') {
    return (
      <Card variant="elevated" padding="lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[--color-fill-secondary] flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-[--color-label-tertiary]" />
          </div>
          <CardTitle className="text-2xl">Invitation declined</CardTitle>
          <CardDescription className="mt-2">
            You&apos;ve declined the invitation to join{' '}
            {invitation?.organizationName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <Spinner size="sm" />
          <span className="ml-2 text-sm text-[--color-label-secondary]">
            Redirecting...
          </span>
        </CardContent>
      </Card>
    );
  }

  // Valid invitation - show details and actions
  return (
    <Card variant="elevated" padding="lg">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-[--color-accent-blue]/10 flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-[--color-accent-blue]" />
        </div>
        <CardTitle className="text-2xl">You&apos;re invited!</CardTitle>
        <CardDescription className="mt-2">
          You&apos;ve been invited to join{' '}
          {invitation?.type === 'team' ? 'a team' : 'an organization'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-[--color-accent-red]/10 text-sm text-[--color-accent-red]">
            {errorMessage}
          </div>
        )}

        {/* Invitation details card */}
        <div className="p-5 rounded-xl bg-[--color-fill-primary] space-y-4">
          {/* Inviter */}
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              <AvatarFallback>
                {invitation?.invitedByName
                  ? getInitials(invitation.invitedByName)
                  : '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-[--color-label-primary]">
                <span className="font-medium">{invitation?.invitedByName}</span>{' '}
                invited you to join
              </p>
              <p className="text-xs text-[--color-label-tertiary]">
                Sent to {invitation?.email}
              </p>
            </div>
          </div>

          {/* Organization/Team */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-[--color-background-primary] border border-[--color-separator]">
            <Avatar size="lg">
              <AvatarFallback className="bg-gradient-to-br from-[--color-accent-indigo] to-[--color-accent-purple]">
                {invitation?.type === 'team' ? (
                  <Users className="w-6 h-6 text-white" />
                ) : (
                  <Building2 className="w-6 h-6 text-white" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[--color-label-primary] truncate">
                {invitation?.organizationName}
              </h3>
              {invitation?.teamName && (
                <p className="text-sm text-[--color-label-secondary] truncate">
                  Team: {invitation.teamName}
                </p>
              )}
              <p className="text-sm text-[--color-label-secondary]">
                Role: <span className="font-medium">{formatRole(invitation?.role || 'member')}</span>
              </p>
            </div>
          </div>

          {/* Expiration info */}
          {invitation?.expiresAt && (
            <div className="flex items-center gap-2 text-xs text-[--color-label-tertiary]">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatExpiresAt(invitation.expiresAt)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {isAuthenticated ? (
          // User is logged in - show accept/decline buttons
          <div className="space-y-3">
            <Button
              onClick={handleAccept}
              fullWidth
              size="lg"
              isLoading={state === 'accepting'}
              disabled={state === 'declining'}
            >
              Accept invitation
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleDecline}
              variant="plain"
              fullWidth
              disabled={state === 'accepting'}
              isLoading={state === 'declining'}
            >
              Decline
            </Button>
          </div>
        ) : (
          // User is not logged in - show login prompt
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[--color-accent-blue]/5 border border-[--color-accent-blue]/20">
              <div className="flex items-start gap-3">
                <LogIn className="w-5 h-5 text-[--color-accent-blue] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[--color-label-primary]">
                    Sign in to continue
                  </p>
                  <p className="text-xs text-[--color-label-secondary]">
                    You need to be signed in with{' '}
                    <span className="font-medium">{invitation?.email}</span> to
                    accept this invitation.
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={handleLoginToAccept} fullWidth size="lg">
              Sign in to accept
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-[--color-label-tertiary]">
          By accepting, you agree to join this {invitation?.type === 'team' ? 'team' : 'organization'} and
          share your profile information with its members.
        </p>
      </CardContent>
    </Card>
  );
}
