'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Spinner } from '@d2d/ui';
import { useAppDispatch } from '@/hooks/useStore';
import { determineDomainAction, setDomainSignup, setLoading, setError } from '@/store/auth.slice';
import { setMockAuth } from '@/lib/mock-auth';
import { requestMagicLink, ApiError } from '@/lib/api';
import type { MagicLinkResponse, DomainSignupResult } from '@d2d/types';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type EmailForm = z.infer<typeof emailSchema>;

const RESEND_COOLDOWN = 60; // seconds

/**
 * Convert API response to local DomainSignupResult format for UI consistency
 */
function apiResponseToDomainInfo(
  email: string,
  response: MagicLinkResponse
): DomainSignupResult {
  const domain = email.split('@')[1]?.toLowerCase() || null;

  if (!response.is_work_email) {
    return {
      action: 'none',
      isWorkEmail: false,
      domain: null,
      organization: null,
      joinRequest: null,
    };
  }

  if (response.domain_action === 'request_to_join' && response.existing_organization) {
    return {
      action: 'join_request_created',
      isWorkEmail: true,
      domain,
      organization: {
        id: '', // Will be set after verification
        name: response.existing_organization.name,
        slug: response.existing_organization.slug,
        logoUrl: null,
        domain,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      joinRequest: null, // Will be created after verification
    };
  }

  // Create organization flow
  const orgName = domain ? domain.split('.')[0] : '';
  const capitalizedName = orgName.charAt(0).toUpperCase() + orgName.slice(1);

  return {
    action: 'organization_created',
    isWorkEmail: true,
    domain,
    organization: {
      id: '', // Will be set after verification
      name: capitalizedName,
      slug: orgName,
      logoUrl: null,
      domain,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    joinRequest: null,
  };
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [domainInfo, setDomainInfo] = useState<DomainSignupResult | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Get returnUrl from URL params (e.g., from invitation flow)
  const returnUrl = searchParams.get('returnUrl');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: EmailForm) => {
    dispatch(setLoading());
    setSubmitError(null);

    if (USE_MOCK_AUTH) {
      // Mock mode: use local domain determination
      const domainSignup = determineDomainAction(data.email);
      dispatch(setDomainSignup(domainSignup));
      // Store returnUrl for post-verification redirect (e.g., invitation acceptance)
      setMockAuth({ email: data.email, domainSignup, returnUrl });
      setDomainInfo(domainSignup);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      return;
    }

    // API mode: call backend
    try {
      const response = await requestMagicLink(data.email);

      // Convert API response to local format
      const domainSignup = apiResponseToDomainInfo(data.email, response);
      dispatch(setDomainSignup(domainSignup));

      // Store email and returnUrl for verification page
      // returnUrl is used for post-verification redirect (e.g., invitation acceptance)
      setMockAuth({ email: data.email, domainSignup, returnUrl });

      setDomainInfo(domainSignup);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.userMessage
          : 'Something went wrong. Please try again.';

      dispatch(setError(errorMessage));
      setSubmitError(errorMessage);
    }
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleContinue = () => {
    router.push('/verify');
  };

  const handleResend = async () => {
    setIsResending(true);
    setSubmitError(null);

    if (USE_MOCK_AUTH) {
      // Mock mode: simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else {
      // API mode: call backend
      try {
        await requestMagicLink(submittedEmail);
      } catch (error) {
        const errorMessage =
          error instanceof ApiError
            ? error.userMessage
            : 'Failed to resend. Please try again.';
        setSubmitError(errorMessage);
      }
    }

    setIsResending(false);
    setResendCooldown(RESEND_COOLDOWN);
  };

  const handleChangeEmail = () => {
    setIsSubmitted(false);
    setSubmittedEmail('');
    setDomainInfo(null);
  };

  // Check email state - show after submission
  if (isSubmitted && domainInfo) {
    return (
      <Card variant="elevated" padding="lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[--color-accent-green]/10 flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-[--color-accent-green]" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription className="mt-2">
            We sent a magic link to{' '}
            <span className="font-medium text-[--color-label-primary]">
              {submittedEmail}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Domain-specific message */}
          {domainInfo.action === 'organization_created' && (
            <div className="p-4 rounded-xl bg-[--color-accent-blue]/10 text-sm">
              <p className="font-medium text-[--color-accent-blue]">
                You&apos;ll be creating a new organization
              </p>
              <p className="text-[--color-label-secondary] mt-1">
                As the first user from your domain, you&apos;ll be the owner of{' '}
                <span className="font-medium">{domainInfo.organization?.name}</span>
              </p>
            </div>
          )}

          {domainInfo.action === 'join_request_created' && (
            <div className="p-4 rounded-xl bg-[--color-accent-orange]/10 text-sm">
              <p className="font-medium text-[--color-accent-orange]">
                Request to join {domainInfo.organization?.name}
              </p>
              <p className="text-[--color-label-secondary] mt-1">
                Your organization already uses Data2Decision. We&apos;ll send a join
                request to the admins.
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-3 text-sm text-[--color-label-secondary]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[--color-accent-green] shrink-0 mt-0.5" />
              <p>Click the link in your email to continue</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[--color-accent-green] shrink-0 mt-0.5" />
              <p>The link expires in 15 minutes</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[--color-accent-green] shrink-0 mt-0.5" />
              <p>Check your spam folder if you don&apos;t see it</p>
            </div>
          </div>

          {/* Error display */}
          {submitError && (
            <div className="p-3 rounded-lg bg-[--color-accent-red]/10 text-sm text-[--color-accent-red]">
              {submitError}
            </div>
          )}

          {/* Resend and change email */}
          <div className="flex flex-col items-center gap-3 pt-4 border-t border-[--color-separator]">
            <Button
              onClick={handleResend}
              variant="outline"
              fullWidth
              disabled={resendCooldown > 0}
              isLoading={isResending}
            >
              <RefreshCw className="w-4 h-4" />
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend magic link'}
            </Button>

            <button
              onClick={handleChangeEmail}
              className="text-sm text-[--color-accent-blue] hover:underline"
            >
              Use a different email
            </button>
          </div>

          {/* For testing - simulate clicking magic link */}
          <div className="pt-4 border-t border-[--color-separator]">
            <p className="text-xs text-[--color-label-tertiary] mb-3 text-center">
              For testing purposes:
            </p>
            <Button
              onClick={handleContinue}
              fullWidth
              variant="tinted"
            >
              Simulate clicking magic link
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Initial email entry form
  return (
    <Card variant="elevated" padding="lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sign in to Data2Decision</CardTitle>
        <CardDescription className="mt-2">
          Enter your email and we&apos;ll send you a secure sign-in link
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* API error display */}
          {submitError && (
            <div className="p-3 rounded-lg bg-[--color-accent-red]/10 text-sm text-[--color-accent-red]">
              {submitError}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[--color-label-primary]"
            >
              Email address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              variant={errors.email || submitError ? 'error' : 'default'}
              leftIcon={<Mail className="w-4 h-4" />}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-[--color-accent-red]">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting}
          >
            Send magic link
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-[--color-label-tertiary]">
          No password needed. We&apos;ll email you a secure link that expires in 15
          minutes.
        </p>

        {/* Test credentials info */}
        <div className="mt-6 p-4 rounded-xl bg-[--color-fill-primary] text-xs text-[--color-label-secondary]">
          <p className="font-medium text-[--color-label-primary] mb-2">
            Test emails:
          </p>
          <ul className="space-y-1">
            <li>
              <code className="text-[--color-accent-blue]">test@gmail.com</code> - Personal flow
            </li>
            <li>
              <code className="text-[--color-accent-blue]">test@newstartup.com</code> - New org flow
            </li>
            <li>
              <code className="text-[--color-accent-blue]">test@existingcorp.com</code> - Join request flow
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function LoginLoading() {
  return (
    <Card variant="elevated" padding="lg">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-[--color-fill-primary] flex items-center justify-center mb-4">
          <Spinner size="lg" />
        </div>
        <CardTitle className="text-2xl">Loading...</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}
