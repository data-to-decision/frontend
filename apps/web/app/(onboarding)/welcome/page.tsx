'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Building2, ArrowRight, Crown } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@d2d/ui';
import { useAppSelector } from '@/hooks/useStore';
import { getMockAuth } from '@/lib/mock-auth';

export default function WelcomePage() {
  const router = useRouter();
  const { domainSignup } = useAppSelector((state) => state.auth);
  const [showConfetti, setShowConfetti] = useState(false);

  const mockAuth = getMockAuth();
  const orgName = domainSignup?.organization?.name || mockAuth.domainSignup?.organization?.name || 'Your Organization';
  const isOrgCreator = domainSignup?.action === 'organization_created' || mockAuth.domainSignup?.action === 'organization_created';

  useEffect(() => {
    // Trigger confetti animation
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    router.push('/profile');
  };

  return (
    <div className="relative">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: [
                  'var(--color-accent-blue)',
                  'var(--color-accent-green)',
                  'var(--color-accent-purple)',
                  'var(--color-accent-orange)',
                  'var(--color-accent-pink)',
                ][Math.floor(Math.random() * 5)],
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}
        </div>
      )}

      <Card variant="elevated" padding="lg">
        <CardHeader className="text-center">
          {/* Celebration Icon */}
          <div className="relative mx-auto mb-6">
            <div className="absolute -inset-4 bg-[--color-accent-blue]/20 rounded-full blur-xl" />
            <div className="relative w-20 h-20 rounded-full bg-[--color-accent-blue] flex items-center justify-center animate-celebrate">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>

          <CardTitle className="text-3xl">
            Welcome to Data2Decision!
          </CardTitle>
          <CardDescription className="mt-3 text-base">
            {isOrgCreator
              ? "You've successfully created your organization"
              : 'Your account is ready to go'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Organization Card */}
          {isOrgCreator && (
            <div className="p-5 rounded-xl bg-[--color-accent-blue]/5 border border-[--color-accent-blue]/20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[--color-accent-indigo] flex items-center justify-center text-white font-semibold text-xl">
                  {orgName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-[--color-label-primary]">
                      {orgName}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[--color-accent-orange]/10 text-[--color-accent-orange] text-xs font-medium">
                      <Crown className="w-3 h-3" />
                      Owner
                    </span>
                  </div>
                  <p className="text-sm text-[--color-label-secondary]">
                    {domainSignup?.domain || mockAuth.domainSignup?.domain}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* What's next */}
          <div className="space-y-3">
            <h4 className="font-medium text-[--color-label-primary]">
              What&apos;s next?
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[--color-fill-primary]">
                <div className="w-8 h-8 rounded-full bg-[--color-accent-blue]/10 flex items-center justify-center text-[--color-accent-blue] font-medium text-sm">
                  1
                </div>
                <span className="text-sm text-[--color-label-primary]">
                  Complete your profile
                </span>
              </div>
              {isOrgCreator && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[--color-fill-primary]">
                  <div className="w-8 h-8 rounded-full bg-[--color-fill-primary] flex items-center justify-center text-[--color-label-tertiary] font-medium text-sm">
                    2
                  </div>
                  <span className="text-sm text-[--color-label-secondary]">
                    Customize your organization
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[--color-fill-primary]">
                <div className="w-8 h-8 rounded-full bg-[--color-fill-primary] flex items-center justify-center text-[--color-label-tertiary] font-medium text-sm">
                  {isOrgCreator ? '3' : '2'}
                </div>
                <span className="text-sm text-[--color-label-secondary]">
                  Connect your first data source
                </span>
              </div>
            </div>
          </div>

          <Button onClick={handleContinue} fullWidth size="lg">
            Get started
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
