'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, XCircle, RefreshCw } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Spinner } from '@d2d/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { setAuthenticated, setDomainSignup } from '@/store/auth.slice';
import { setCurrentStep } from '@/store/onboarding.slice';
import {
  getMockAuth,
  setMockAuth,
  createMockUser,
  simulateVerification,
} from '@/lib/mock-auth';
import { verifyMagicLink, ApiError } from '@/lib/api';
import { setAccessToken } from '@/lib/auth/tokens';
import type { DomainSignupResult, User, DomainSignupApiResult, OnboardingStatus, TokenResponseUser } from '@d2d/types';

/**
 * Transform the user object from API response (snake_case) to frontend User type (camelCase)
 */
function transformTokenResponseUser(apiUser: TokenResponseUser): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    name: apiUser.name,
    displayName: apiUser.display_name,
    avatarUrl: apiUser.avatar_url,
    role: apiUser.is_system_admin ? 'superadmin' : 'user',
    organizationId: null,
    organizationRole: null,
    createdAt: apiUser.created_at,
    updatedAt: apiUser.updated_at,
    onboardingComplete: apiUser.onboarding_status === 'completed' || !!apiUser.name,
    onboardingStatus: apiUser.onboarding_status,
  };
}

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

type VerificationState = 'verifying' | 'success' | 'error' | 'expired' | 'deactivated';

/**
 * Convert API domain signup result to local format
 */
function apiDomainSignupToLocal(
  apiResult: DomainSignupApiResult | undefined
): DomainSignupResult | null {
  if (!apiResult) {
    return null;
  }

  // Map API action to local action
  let localAction: DomainSignupResult['action'];
  switch (apiResult.action) {
    case 'organization_created':
      localAction = 'organization_created';
      break;
    case 'join_request_created':
    case 'request_pending':
      localAction = 'join_request_created';
      break;
    case 'already_member':
      localAction = 'none';
      break;
    default:
      localAction = 'none';
  }

  return {
    action: localAction,
    isWorkEmail: !!apiResult.organization,
    domain: apiResult.organization?.domain || null,
    organization: apiResult.organization
      ? {
          id: apiResult.organization.id,
          name: apiResult.organization.name,
          slug: apiResult.organization.slug,
          logoUrl: null,
          domain: apiResult.organization.domain,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      : null,
    joinRequest: apiResult.join_request
      ? {
          id: apiResult.join_request.id,
          userId: '',
          organizationId: apiResult.join_request.organization_id,
          status: apiResult.join_request.status,
          createdAt: apiResult.join_request.created_at,
          updatedAt: apiResult.join_request.created_at,
        }
      : null,
  };
}

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { domainSignup } = useAppSelector((state) => state.auth);
  const [state, setState] = useState<VerificationState>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Track the last verified token instead of a boolean to allow re-verification with different tokens
  const [lastVerifiedToken, setLastVerifiedToken] = useState<string | null>(null);

  // Extract token at the top of the component for consistent access
  const currentToken = searchParams.get('token');

  useEffect(() => {
    // Only re-verify if the current token differs from the last verified token
    // This handles both: React Strict Mode (same token = skip) and URL changes (new token = verify)
    if (currentToken === lastVerifiedToken) {
      return;
    }
    setLastVerifiedToken(currentToken);
    // Reset state for new verification attempt
    setState('verifying');
    setErrorMessage(null);
    async function verifyWithMock() {
      // Get stored auth data
      const mockAuth = getMockAuth();

      // Check for test parameter to simulate expired link
      const token = searchParams.get('token');
      if (token === 'expired') {
        await simulateVerification();
        setState('expired');
        return;
      }

      if (!mockAuth.email || !mockAuth.domainSignup) {
        // No pending verification, redirect to login
        router.replace('/login');
        return;
      }

      // Simulate verification delay
      await simulateVerification();

      // Create mock user
      const user = createMockUser(mockAuth.email, mockAuth.domainSignup);
      setMockAuth({ user });

      // Update Redux state
      dispatch(setAuthenticated(user));

      handleVerificationSuccess(user.onboardingStatus, mockAuth.domainSignup.action);
    }

    async function verifyWithApi() {
      const token = searchParams.get('token');

      if (!token) {
        // No token in URL - check if we have mock auth data for testing
        const mockAuth = getMockAuth();
        if (mockAuth.email && mockAuth.domainSignup) {
          // Testing mode: use mock auth data
          await verifyWithMock();
          return;
        }

        // No token and no mock data - redirect to login
        router.replace('/login');
        return;
      }

      // Handle test tokens for expired/invalid states
      if (token === 'expired') {
        setState('expired');
        return;
      }

      try {
        const response = await verifyMagicLink(token);

        // Store access token (refresh token is stored via httpOnly cookie by backend)
        setAccessToken(response.access_token, response.expires_in);

        // Convert and set domain signup info
        const localDomainSignup = apiDomainSignupToLocal(response.domain_signup);
        if (localDomainSignup) {
          dispatch(setDomainSignup(localDomainSignup));
        }

        // Transform and set authenticated user
        // The API returns snake_case (TokenResponseUser), we transform to camelCase (User)
        let transformedUser: User | null = null;
        if (response.user) {
          transformedUser = transformTokenResponseUser(response.user);
          dispatch(setAuthenticated(transformedUser));
        }

        // Determine redirect based on onboarding status and domain signup action
        const onboardingStatus = transformedUser?.onboardingStatus;
        const action = response.domain_signup?.action;
        handleVerificationSuccess(onboardingStatus, mapApiActionToLocalAction(action));
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.code === 'TOKEN_EXPIRED') {
            setState('expired');
          } else if (error.code === 'ACCOUNT_DEACTIVATED') {
            setState('deactivated');
          } else {
            setErrorMessage(error.userMessage);
            setState('error');
          }
        } else {
          setErrorMessage('Something went wrong. Please try again.');
          setState('error');
        }
      }
    }

    function mapApiActionToLocalAction(
      action: string | undefined
    ): DomainSignupResult['action'] | undefined {
      switch (action) {
        case 'organization_created':
          return 'organization_created';
        case 'join_request_created':
        case 'request_pending':
          return 'join_request_created';
        case 'already_member':
          return 'none';
        default:
          return undefined;
      }
    }

    function handleVerificationSuccess(
      onboardingStatus: OnboardingStatus | undefined,
      action: DomainSignupResult['action'] | undefined
    ) {
      setState('success');

      // Short delay to show success, then redirect based on flow
      setTimeout(() => {
        // Check if there's a returnUrl from the login flow (e.g., invitation acceptance)
        const mockAuth = getMockAuth();
        const storedReturnUrl = mockAuth.returnUrl;

        // If user has already completed onboarding, go to returnUrl or dashboard
        // Clear the returnUrl only when we actually use it
        if (onboardingStatus === 'completed') {
          if (storedReturnUrl) {
            setMockAuth({ returnUrl: null });
            router.push(storedReturnUrl);
          } else {
            router.push('/');
          }
          return;
        }

        // For users who need onboarding, keep the returnUrl stored
        // It will be used after onboarding completes

        // If user needs to set up organization (work email user without org setup)
        if (onboardingStatus === 'pending_org') {
          dispatch(setCurrentStep('organization'));
          router.push('/organization');
          return;
        }

        // If user needs to complete their profile
        if (onboardingStatus === 'pending_profile') {
          dispatch(setCurrentStep('profile'));
          router.push('/profile');
          return;
        }

        // Handle based on domain signup action
        if (action === 'join_request_created') {
          // User needs to wait for approval
          dispatch(setCurrentStep('pending'));
          router.push('/pending');
        } else if (action === 'organization_created') {
          // New org creator - show celebration, then profile
          dispatch(setCurrentStep('profile'));
          router.push('/welcome');
        } else {
          // Personal user or already member with pending profile - go to profile setup
          dispatch(setCurrentStep('profile'));
          router.push('/profile');
        }
      }, 1000);
    }

    // Choose verification method based on mock flag
    if (USE_MOCK_AUTH) {
      verifyWithMock();
    } else {
      verifyWithApi();
    }
  }, [dispatch, router, searchParams, currentToken, lastVerifiedToken]);

  return (
    <Card variant="elevated" padding="lg">
      <CardHeader className="text-center">
        {state === 'verifying' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-[--color-fill-primary] flex items-center justify-center mb-4">
              <Spinner size="lg" />
            </div>
            <CardTitle className="text-2xl">Verifying your email</CardTitle>
            <CardDescription className="mt-2">
              Just a moment while we confirm your identity...
            </CardDescription>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-[--color-accent-green]/10 flex items-center justify-center mb-4 animate-scale-in">
              <CheckCircle2 className="w-8 h-8 text-[--color-accent-green]" />
            </div>
            <CardTitle className="text-2xl">Email verified</CardTitle>
            <CardDescription className="mt-2">
              {domainSignup?.action === 'organization_created'
                ? `Welcome! ${domainSignup.organization?.name} has been created.`
                : domainSignup?.action === 'join_request_created'
                  ? `Your request to join ${domainSignup.organization?.name} has been sent.`
                  : 'Redirecting you to complete your profile...'}
            </CardDescription>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-[--color-accent-red]/10 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-[--color-accent-red]" />
            </div>
            <CardTitle className="text-2xl">Verification failed</CardTitle>
            <CardDescription className="mt-2">
              {errorMessage || 'Something went wrong. Please try signing in again.'}
            </CardDescription>
          </>
        )}

        {state === 'expired' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-[--color-accent-orange]/10 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-[--color-accent-orange]" />
            </div>
            <CardTitle className="text-2xl">Link expired</CardTitle>
            <CardDescription className="mt-2">
              This magic link has expired. Please request a new one.
            </CardDescription>
          </>
        )}

        {state === 'deactivated' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-[--color-accent-orange]/10 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-[--color-accent-orange]" />
            </div>
            <CardTitle className="text-2xl">Account deactivated</CardTitle>
            <CardDescription className="mt-2">
              Your account has been deactivated. Please contact support if you'd like to reactivate it.
            </CardDescription>
          </>
        )}
      </CardHeader>

      <CardContent>
        {state === 'verifying' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-[--color-label-secondary]">
              <div className="w-5 h-5 rounded-full bg-[--color-fill-primary] flex items-center justify-center">
                <Loader2 className="w-3 h-3 animate-spin" />
              </div>
              <span>Validating magic link token</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[--color-label-tertiary]">
              <div className="w-5 h-5 rounded-full bg-[--color-fill-primary]" />
              <span>Creating your session</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[--color-label-tertiary]">
              <div className="w-5 h-5 rounded-full bg-[--color-fill-primary]" />
              <span>Setting up your account</span>
            </div>
          </div>
        )}

        {state === 'success' && (
          <div className="flex items-center justify-center">
            <Spinner size="sm" />
            <span className="ml-2 text-sm text-[--color-label-secondary]">
              Redirecting...
            </span>
          </div>
        )}

        {(state === 'error' || state === 'expired') && (
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/login')}
              fullWidth
            >
              <RefreshCw className="w-4 h-4" />
              Request new link
            </Button>
            <Link
              href="/login"
              className="block text-center text-sm text-[--color-accent-blue] hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        )}

        {state === 'deactivated' && (
          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = 'mailto:support@data2decision.com?subject=Account%20Reactivation%20Request'}
              fullWidth
            >
              Contact Support
            </Button>
            <Link
              href="/login"
              className="block text-center text-sm text-[--color-accent-blue] hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VerifyLoading() {
  return (
    <Card variant="elevated" padding="lg">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-[--color-fill-primary] flex items-center justify-center mb-4">
          <Spinner size="lg" />
        </div>
        <CardTitle className="text-2xl">Verifying your email</CardTitle>
        <CardDescription className="mt-2">
          Just a moment while we confirm your identity...
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyLoading />}>
      <VerifyContent />
    </Suspense>
  );
}
