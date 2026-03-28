'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database,
  Sparkles,
  Plus,
  ArrowRight,
  BarChart3,
  FileText,
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
  Spinner,
} from '@d2d/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { setAuthenticated, setDomainSignup } from '@/store/auth.slice';
import { getMockAuth } from '@/lib/mock-auth';
import { Sidebar } from '@/components/layout';
import { hasStoredSession } from '@/lib/auth/tokens';
import { getCurrentUser } from '@/lib/api/auth';

// Check if mock auth is enabled
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

const QUICK_ACTIONS = [
  {
    icon: Database,
    label: 'Connect a data source',
    description: 'Import data from databases, APIs, or files',
    color: 'blue' as const,
  },
  {
    icon: BarChart3,
    label: 'Create a visualization',
    description: 'Build charts and dashboards from your data',
    color: 'purple' as const,
  },
  {
    icon: FileText,
    label: 'Generate a report',
    description: 'Let AI create insights from your data',
    color: 'green' as const,
  },
];

export default function WorkspacePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, domainSignup } = useAppSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticatedState] = useState(false);
  const hasCheckedAuth = useRef(false);

  /**
   * Check authentication using the real API
   * Validates stored session and fetches current user
   *
   * IMPORTANT: Redirect happens BEFORE setting isLoading=false to prevent content flash
   */
  const checkApiAuth = useCallback(async () => {
    // Check if there's a stored session (refresh token)
    if (!hasStoredSession()) {
      // Redirect immediately without setting isLoading=false
      router.replace('/login');
      return;
    }

    try {
      // Fetch current user from API (authApi handles token refresh)
      const currentUser = await getCurrentUser();

      // Update Redux state with the fetched user
      dispatch(setAuthenticated(currentUser));

      // Check if user needs to complete onboarding
      // Redirect to appropriate onboarding step if not complete
      if (currentUser.onboardingStatus === 'pending_profile') {
        router.replace('/profile');
        return;
      }
      if (currentUser.onboardingStatus === 'pending_org') {
        router.replace('/organization');
        return;
      }

      // Only set authenticated state AFTER successful auth check and onboarding complete
      setIsAuthenticatedState(true);
      setIsLoading(false);
    } catch {
      // Auth failed - redirect immediately without setting isLoading=false
      router.replace('/login');
    }
  }, [router, dispatch]);

  /**
   * Check authentication using mock auth (localStorage)
   *
   * IMPORTANT: Redirect happens BEFORE setting isLoading=false to prevent content flash
   */
  const checkMockAuth = useCallback(() => {
    const mockAuth = getMockAuth();

    if (!mockAuth.user) {
      // Redirect immediately without setting isLoading=false
      router.replace('/login');
      return;
    }

    // Sync Redux state with localStorage
    dispatch(setAuthenticated(mockAuth.user));
    if (mockAuth.domainSignup) {
      dispatch(setDomainSignup(mockAuth.domainSignup));
    }

    // Check if user needs to complete onboarding
    // Redirect to appropriate onboarding step if not complete
    if (mockAuth.user.onboardingStatus === 'pending_profile') {
      router.replace('/profile');
      return;
    }
    if (mockAuth.user.onboardingStatus === 'pending_org') {
      router.replace('/organization');
      return;
    }

    // Only set authenticated state AFTER successful auth check and onboarding complete
    setIsAuthenticatedState(true);
    setIsLoading(false);
  }, [router, dispatch]);

  useEffect(() => {
    // Prevent multiple auth checks - only run once on mount
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    if (USE_MOCK_AUTH) {
      checkMockAuth();
    } else {
      checkApiAuth();
    }
  }, [checkMockAuth, checkApiAuth]);

  const mockAuth = getMockAuth();
  const displayUser = user || mockAuth.user;
  const displayName = displayUser?.name?.split(' ')[0] || 'there';
  const organizationName =
    domainSignup?.organization?.name || mockAuth.domainSignup?.organization?.name;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--color-background-primary]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[--color-background-primary]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-5xl mx-auto">
          {/* Welcome header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <Avatar size="lg">
                {displayUser?.avatarUrl && (
                  <AvatarImage src={displayUser.avatarUrl} alt={displayName} />
                )}
                <AvatarFallback>
                  {displayUser?.name ? getInitials(displayUser.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-semibold text-[--color-label-primary]">
                  {getGreeting()}, {displayName}!
                </h1>
                {organizationName && (
                  <p className="text-[--color-label-secondary]">
                    Welcome to {organizationName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* AI Assistant card */}
          <Card variant="elevated" padding="lg" className="mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[--color-accent-blue] to-[--color-accent-purple] flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-[--color-label-primary] mb-1">
                  Ask anything about your data
                </h2>
                <p className="text-[--color-label-secondary] text-sm mb-4">
                  Data2Decision can answer questions, create visualizations, and
                  generate insights from your connected data sources.
                </p>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="e.g., Show me revenue trends for Q1..."
                      className="w-full h-10 px-4 rounded-lg border border-[--color-separator] bg-[--color-fill-primary] text-[--color-label-primary] placeholder:text-[--color-label-tertiary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-blue]/20 focus:border-[--color-accent-blue]"
                    />
                  </div>
                  <Button>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick actions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[--color-label-primary] mb-4">
              Quick actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                const colorClasses = {
                  blue: 'bg-[--color-accent-blue]/10 text-[--color-accent-blue]',
                  purple:
                    'bg-[--color-accent-purple]/10 text-[--color-accent-purple]',
                  green:
                    'bg-[--color-accent-green]/10 text-[--color-accent-green]',
                }[action.color];

                return (
                  <Card
                    key={action.label}
                    variant="outlined"
                    padding="md"
                    className="cursor-pointer hover:border-[--color-label-tertiary] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClasses}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-[--color-label-primary]">
                          {action.label}
                        </h4>
                        <p className="text-sm text-[--color-label-secondary] mt-0.5">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Empty state for canvas */}
          <Card variant="filled" padding="lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-[--color-fill-primary] flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-[--color-label-tertiary]" />
              </div>
              <CardTitle>Your canvas is empty</CardTitle>
              <CardDescription className="mt-2">
                Connect a data source or ask the AI assistant to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="tinted">
                <Plus className="w-4 h-4" />
                Add your first widget
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
