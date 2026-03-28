'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle2, ArrowRight, RefreshCw, XCircle } from 'lucide-react';
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
import { completeOnboarding } from '@/store/onboarding.slice';
import { getMockAuth, setMockAuth, simulateApiCall } from '@/lib/mock-auth';

type ApprovalStatus = 'pending' | 'checking' | 'approved' | 'rejected';

export default function PendingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { domainSignup } = useAppSelector((state) => state.auth);
  const [status, setStatus] = useState<ApprovalStatus>('pending');

  const organizationName = domainSignup?.organization?.name || 'the organization';

  const handleCheckStatus = async () => {
    setStatus('checking');
    await simulateApiCall(null, 1000);
    // Still pending
    setStatus('pending');
  };

  const handleSimulateApproval = async () => {
    setStatus('checking');
    await simulateApiCall(null, 1500);
    setStatus('approved');

    // Update mock auth
    const mockAuth = getMockAuth();
    if (mockAuth.user) {
      setMockAuth({
        user: {
          ...mockAuth.user,
          onboardingComplete: true,
        },
      });
    }

    // Short delay then redirect
    setTimeout(() => {
      dispatch(completeOnboarding());
      router.push('/');
    }, 2000);
  };

  const handleCancelRequest = async () => {
    setStatus('rejected');
    await simulateApiCall(null, 500);
    router.push('/login');
  };

  if (status === 'approved') {
    return (
      <Card variant="elevated" padding="lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[--color-accent-green]/10 flex items-center justify-center mb-4 animate-scale-in">
            <CheckCircle2 className="w-8 h-8 text-[--color-accent-green]" />
          </div>
          <CardTitle className="text-2xl">You&apos;re approved!</CardTitle>
          <CardDescription className="mt-2">
            Welcome to {organizationName}. Redirecting you to your workspace...
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

  return (
    <Card variant="elevated" padding="lg">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-[--color-accent-orange]/10 flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-[--color-accent-orange]" />
        </div>
        <CardTitle className="text-2xl">Request sent</CardTitle>
        <CardDescription className="mt-2">
          Your request to join{' '}
          <span className="font-medium text-[--color-label-primary]">
            {organizationName}
          </span>{' '}
          has been sent to the admins.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status indicator */}
        <div className="p-4 rounded-xl bg-[--color-fill-primary]">
          <div className="flex items-center gap-3 mb-4">
            {status === 'checking' ? (
              <Spinner size="sm" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-[--color-accent-orange] animate-pulse" />
            )}
            <span className="font-medium text-[--color-label-primary]">
              {status === 'checking' ? 'Checking status...' : 'Waiting for approval'}
            </span>
          </div>

          <div className="space-y-2 text-sm text-[--color-label-secondary]">
            <p>What happens next:</p>
            <ol className="list-decimal list-inside space-y-1 ml-1">
              <li>An admin from {organizationName} reviews your request</li>
              <li>You&apos;ll receive an email when approved</li>
              <li>Once approved, you can access the workspace</li>
            </ol>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleCheckStatus}
            variant="outline"
            fullWidth
            isLoading={status === 'checking'}
          >
            <RefreshCw className="w-4 h-4" />
            Check status
          </Button>

          <Button onClick={handleCancelRequest} variant="plain" fullWidth>
            <XCircle className="w-4 h-4" />
            Cancel request
          </Button>
        </div>

        {/* Testing helper */}
        <div className="pt-4 border-t border-[--color-separator]">
          <p className="text-xs text-[--color-label-tertiary] mb-3 text-center">
            For testing purposes:
          </p>
          <Button
            onClick={handleSimulateApproval}
            variant="tinted"
            fullWidth
            disabled={status === 'checking'}
          >
            <CheckCircle2 className="w-4 h-4" />
            Simulate approval
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
