'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Globe,
  Clock,
  MapPin,
  Check,
  X,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Spinner,
} from '@d2d/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import {
  setSessions,
  setLoading,
  setError,
  revokeSession as revokeSessionAction,
  revokeAllSessions as revokeAllSessionsAction,
} from '@/store/session.slice';
import {
  initializeMockSessions,
  revokeSession as revokeMockSession,
  revokeAllOtherSessions as revokeAllMockSessions,
} from '@/lib/mock-sessions';
import { simulateApiCall } from '@/lib/mock-auth';
import {
  getSessions,
  revokeSessionById,
  logoutAllSessions,
} from '@/lib/api/auth';
import { clearTokens } from '@/lib/auth/tokens';
import { redirectToLogin } from '@/lib/auth/redirect';
import type { Session } from '@d2d/types';

// Check if mock auth is enabled
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

function getDeviceIcon(deviceName: string): React.ElementType {
  const name = deviceName.toLowerCase();
  if (name.includes('iphone') || name.includes('android') || name.includes('pixel')) {
    return Smartphone;
  }
  if (name.includes('ipad') || name.includes('tablet')) {
    return Tablet;
  }
  if (name.includes('macbook') || name.includes('thinkpad') || name.includes('laptop')) {
    return Laptop;
  }
  return Monitor;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function SessionRow({
  session,
  onRevoke,
  isRevoking,
}: {
  session: Session;
  onRevoke: () => void;
  isRevoking: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const DeviceIcon = getDeviceIcon(session.deviceName);

  return (
    <div
      className={`p-4 rounded-xl border ${
        session.isCurrent
          ? 'bg-[--color-accent-green]/5 border-[--color-accent-green]/20'
          : 'bg-[--color-fill-primary] border-[--color-separator]'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            session.isCurrent
              ? 'bg-[--color-accent-green]/10'
              : 'bg-[--color-background-secondary]'
          }`}
        >
          <DeviceIcon
            className={`w-5 h-5 ${
              session.isCurrent
                ? 'text-[--color-accent-green]'
                : 'text-[--color-label-tertiary]'
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-[--color-label-primary]">
              {session.deviceName}
            </p>
            {session.isCurrent && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[--color-accent-green]/10 text-[--color-accent-green] border border-[--color-accent-green]/20 whitespace-nowrap">
                Current Session
              </span>
            )}
          </div>

          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-[--color-label-secondary] flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              {session.browser} on {session.os}
            </p>
            <p className="text-xs text-[--color-label-tertiary] flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              {session.location} - {session.ipAddress}
            </p>
            <p className="text-xs text-[--color-label-tertiary] flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Last active {formatDate(session.lastActiveAt)}
            </p>
          </div>
        </div>

        {!session.isCurrent && (
          <div className="shrink-0">
            {showConfirm ? (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    onRevoke();
                    setShowConfirm(false);
                  }}
                  disabled={isRevoking}
                >
                  {isRevoking ? <Spinner size="sm" /> : <Check className="w-3 h-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="gray"
                  onClick={() => setShowConfirm(false)}
                  disabled={isRevoking}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="gray"
                onClick={() => setShowConfirm(true)}
                className="text-[--color-accent-red] hover:bg-[--color-accent-red]/10"
              >
                <LogOut className="w-4 h-4" />
                <span className="ml-1">Revoke</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SessionsSettingsPage() {
  const dispatch = useAppDispatch();
  const { sessions, isLoading, error } = useAppSelector((state) => state.session);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [showRevokeAllConfirm, setShowRevokeAllConfirm] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  // Load sessions on mount
  const loadSessions = useCallback(async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      if (USE_MOCK_AUTH) {
        // Mock mode: use local mock data
        const sessionData = initializeMockSessions();
        dispatch(setSessions(sessionData.sessions));
      } else {
        // API mode: fetch from backend
        // The backend identifies the current session using the device_id cookie
        // and returns is_current: true for the matching session
        const sessionsData = await getSessions();
        dispatch(setSessions(sessionsData));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions';
      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    setIsRevoking(sessionId);

    try {
      if (USE_MOCK_AUTH) {
        // Mock mode
        await simulateApiCall(null, 500);
        revokeMockSession(sessionId);
      } else {
        // API mode
        await revokeSessionById(sessionId);
      }
      dispatch(revokeSessionAction(sessionId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke session';
      dispatch(setError(errorMessage));
    } finally {
      setIsRevoking(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    setIsRevokingAll(true);

    try {
      if (USE_MOCK_AUTH) {
        // Mock mode: only revoke other sessions, keep current
        await simulateApiCall(null, 800);
        revokeAllMockSessions();
        dispatch(revokeAllSessionsAction());
        setShowRevokeAllConfirm(false);
      } else {
        // API mode: this logs out ALL sessions including current
        // User will be redirected to login after this
        await logoutAllSessions();
        clearTokens();
        redirectToLogin();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke all sessions';
      dispatch(setError(errorMessage));
      setIsRevokingAll(false);
      setShowRevokeAllConfirm(false);
    }
  };

  const otherSessions = sessions.filter((s) => !s.isCurrent);
  const currentSession = sessions.find((s) => s.isCurrent);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
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
                  Error Loading Sessions
                </p>
                <p className="text-sm text-[--color-label-secondary] mt-1">
                  {error}
                </p>
              </div>
              <Button
                size="sm"
                variant="gray"
                onClick={loadSessions}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Session */}
      <Card variant="outlined" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage devices and browsers that are signed in to your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Sign out all button */}
          {otherSessions.length > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-[--color-fill-primary] border border-[--color-separator]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[--color-label-primary]">
                    {USE_MOCK_AUTH ? 'Sign out of all other sessions' : 'Sign out of all sessions'}
                  </p>
                  <p className="text-xs text-[--color-label-tertiary] mt-0.5">
                    {USE_MOCK_AUTH
                      ? `This will sign you out of ${otherSessions.length} other ${otherSessions.length === 1 ? 'session' : 'sessions'}`
                      : 'This will sign you out of all devices including this one. You will need to log in again.'
                    }
                  </p>
                </div>

                {showRevokeAllConfirm ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleRevokeAllSessions}
                      disabled={isRevokingAll}
                    >
                      {isRevokingAll ? <Spinner size="sm" /> : 'Confirm'}
                    </Button>
                    <Button
                      size="sm"
                      variant="gray"
                      onClick={() => setShowRevokeAllConfirm(false)}
                      disabled={isRevokingAll}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="gray"
                    onClick={() => setShowRevokeAllConfirm(true)}
                    className="text-[--color-accent-red] hover:bg-[--color-accent-red]/10 whitespace-nowrap"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="ml-1">Sign out all</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Sessions list */}
          <div className="space-y-3">
            {currentSession && (
              <SessionRow
                session={currentSession}
                onRevoke={() => {}}
                isRevoking={false}
              />
            )}

            {otherSessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onRevoke={() => handleRevokeSession(session.id)}
                isRevoking={isRevoking === session.id}
              />
            ))}

            {sessions.length === 0 && (
              <div className="text-center p-8">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[--color-fill-primary] flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-[--color-label-tertiary]" />
                </div>
                <p className="text-sm text-[--color-label-tertiary]">
                  No active sessions found
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security notice */}
      <Card variant="outlined" padding="lg">
        <CardContent className="!mt-0">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[--color-accent-yellow]/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-[--color-accent-yellow]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[--color-label-primary]">
                Security Tip
              </p>
              <p className="text-sm text-[--color-label-secondary] mt-1">
                If you notice any sessions you dont recognize, revoke them immediately
                and change your password. Consider enabling two-factor authentication
                for additional security.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
