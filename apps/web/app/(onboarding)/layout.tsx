'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Layers, User, Building2, Clock, ChevronLeft } from 'lucide-react';
import { Progress } from '@d2d/ui';
import { useAppSelector } from '@/hooks/useStore';

const STEPS = [
  { key: 'profile', label: 'Profile', icon: User, path: '/profile' },
  { key: 'organization', label: 'Organization', icon: Building2, path: '/organization' },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { domainSignup } = useAppSelector((state) => state.auth);

  // Pending page has different layout
  const isPending = pathname === '/pending';

  // Calculate progress
  const currentIndex = STEPS.findIndex((step) => step.path === pathname);
  const progress =
    currentIndex >= 0
      ? ((currentIndex + 1) / (domainSignup?.action === 'organization_created' ? STEPS.length : 1)) * 100
      : 0;

  // Only show steps for org creators, not for personal users
  const showOrgStep = domainSignup?.action === 'organization_created';
  const filteredSteps = showOrgStep ? STEPS : STEPS.slice(0, 1);
  const totalSteps = filteredSteps.length;
  const currentStep = currentIndex + 1;

  // Determine if back button should be shown
  const isWelcome = pathname === '/welcome';
  const canGoBack = currentIndex > 0 || isWelcome;

  const handleBack = () => {
    if (isWelcome) {
      router.push('/login');
    } else if (pathname === '/organization') {
      router.push('/profile');
    } else {
      router.push('/welcome');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[--color-background-secondary]">
      {/* Header with logo */}
      <header className="py-6 px-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[--color-accent-blue] flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg text-[--color-label-primary]">
            Data2Decision
          </span>
        </div>
      </header>

      {/* Progress indicator - only for non-pending and non-welcome pages */}
      {!isPending && !isWelcome && (
        <div className="px-8 py-4 max-w-md mx-auto w-full">
          {/* Back button */}
          {canGoBack && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-[--color-label-secondary] hover:text-[--color-label-primary] transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[--color-label-primary]">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-[--color-label-secondary]">
              {filteredSteps[currentIndex]?.label || 'Setup'}
            </span>
          </div>
          <Progress value={progress} />

          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {filteredSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentIndex;
              const isCompleted = index < currentIndex;

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-2 ${
                    isActive
                      ? 'text-[--color-accent-blue]'
                      : isCompleted
                        ? 'text-[--color-accent-green]'
                        : 'text-[--color-label-tertiary]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-[--color-accent-blue]/10'
                        : isCompleted
                          ? 'bg-[--color-accent-green]/10'
                          : 'bg-[--color-fill-primary]'
                    }`}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium hidden sm:block">
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
