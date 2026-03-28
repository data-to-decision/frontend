'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Camera, ArrowRight, Sparkles, Mail, X, Plus, Users } from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Label,
  getInitials,
} from '@d2d/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { updateOrganizationData, completeOnboarding } from '@/store/onboarding.slice';
import { getMockAuth, setMockAuth, simulateApiCall } from '@/lib/mock-auth';
import { updateCurrentUser, updateOrganization, getCurrentOrganization } from '@/lib/api';
import { updateUser } from '@/store/auth.slice';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
});

type OrganizationForm = z.infer<typeof organizationSchema>;

type Step = 'details' | 'invite';

export default function OrganizationPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { domainSignup } = useAppSelector((state) => state.auth);
  const [step, setStep] = useState<Step>('details');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationForm>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: domainSignup?.organization?.name || '',
    },
  });

  const watchedName = watch('name');
  const orgDomain = domainSignup?.domain;

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmitDetails = async (data: OrganizationForm) => {
    try {
      if (USE_MOCK_AUTH) {
        await simulateApiCall(data, 300);
      } else {
        // Get the current organization and update it
        const currentOrg = await getCurrentOrganization();
        if (currentOrg) {
          await updateOrganization(currentOrg.id, {
            name: data.name,
            logo_url: logoPreview,
          });
        }
      }

      // Update Redux state
      dispatch(
        updateOrganizationData({
          name: data.name,
          logoUrl: logoPreview,
        })
      );

      // Move to invite step
      setStep('invite');
    } catch (error) {
      console.error('Failed to update organization:', error);
      // Still move to invite step even if API fails - user can update later
      setStep('invite');
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddEmail = () => {
    setEmailError(null);

    if (!currentEmail.trim()) {
      return;
    }

    if (!validateEmail(currentEmail)) {
      setEmailError('Enter a valid email address');
      return;
    }

    if (inviteEmails.includes(currentEmail)) {
      setEmailError('This email has already been added');
      return;
    }

    setInviteEmails([...inviteEmails, currentEmail]);
    setCurrentEmail('');
  };

  const handleRemoveEmail = (email: string) => {
    setInviteEmails(inviteEmails.filter((e) => e !== email));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleSendInvites = async () => {
    setIsSending(true);
    await simulateApiCall(inviteEmails, 1000);
    await completeAndRedirect();
  };

  const handleSkip = async () => {
    await completeAndRedirect();
  };

  const completeAndRedirect = async () => {
    try {
      // Get any stored returnUrl before updating mock auth
      const mockAuth = getMockAuth();
      const storedReturnUrl = mockAuth.returnUrl;

      if (USE_MOCK_AUTH) {
        // Update mock storage - clear returnUrl since we're using it
        if (mockAuth.user) {
          setMockAuth({
            user: {
              ...mockAuth.user,
              onboardingComplete: true,
              onboardingStatus: 'completed',
            },
            returnUrl: null,
          });
        }
      } else {
        // Call API to update onboarding_status to completed
        const updatedUser = await updateCurrentUser({
          onboarding_status: 'completed',
        });
        // Update Redux with the response from the server
        dispatch(updateUser(updatedUser));
        // Clear the returnUrl since we're using it
        setMockAuth({ returnUrl: null });
      }

      dispatch(completeOnboarding());

      // Go to returnUrl (e.g., invitation page) if present, otherwise workspace
      router.push(storedReturnUrl || '/');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still redirect to workspace even if API call fails
      // The user can try again from the dashboard
      const mockAuth = getMockAuth();
      const storedReturnUrl = mockAuth.returnUrl;
      setMockAuth({ returnUrl: null });
      dispatch(completeOnboarding());
      router.push(storedReturnUrl || '/');
    }
  };

  if (step === 'invite') {
    return (
      <Card variant="elevated" padding="lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[--color-accent-blue]/10 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-[--color-accent-blue]" />
          </div>
          <CardTitle className="text-2xl">Invite your team</CardTitle>
          <CardDescription className="mt-2">
            Anyone with an @{orgDomain} email can also request to join automatically.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email addresses</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="email"
                  type="email"
                  placeholder={`colleague@${orgDomain}`}
                  value={currentEmail}
                  onChange={(e) => {
                    setCurrentEmail(e.target.value);
                    setEmailError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  variant={emailError ? 'error' : 'default'}
                  leftIcon={<Mail className="w-4 h-4" />}
                />
              </div>
              <Button
                type="button"
                onClick={handleAddEmail}
                variant="outline"
                disabled={!currentEmail.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {emailError && (
              <p className="text-sm text-[--color-accent-red]">{emailError}</p>
            )}
          </div>

          {/* Added emails */}
          {inviteEmails.length > 0 && (
            <div className="space-y-2">
              {inviteEmails.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-3 rounded-lg bg-[--color-fill-primary]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[--color-accent-blue]/10 flex items-center justify-center text-[--color-accent-blue]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-[--color-label-primary]">
                      {email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    className="p-1 rounded-md hover:bg-[--color-fill-secondary] text-[--color-label-tertiary] hover:text-[--color-label-primary] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {inviteEmails.length === 0 && (
            <div className="p-4 rounded-xl bg-[--color-fill-primary] text-center">
              <p className="text-sm text-[--color-label-secondary]">
                Add email addresses to invite team members, or skip for now.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleSendInvites}
              fullWidth
              isLoading={isSending}
              disabled={inviteEmails.length === 0}
            >
              {inviteEmails.length > 0
                ? `Send ${inviteEmails.length} invite${inviteEmails.length > 1 ? 's' : ''} & finish`
                : 'Send invites & finish'}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSkip}
              variant="plain"
              fullWidth
              disabled={isSending}
            >
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg">
      <CardHeader className="text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[--color-accent-blue]/20 to-[--color-accent-purple]/20 flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-[--color-accent-blue]" />
        </div>
        <CardTitle className="text-2xl">
          Customize your organization
        </CardTitle>
        <CardDescription className="mt-2">
          Set up your organization&apos;s name and logo
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmitDetails)} className="space-y-6">
          {/* Logo Upload */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={handleLogoClick}
              className="relative group"
            >
              <Avatar size="xl">
                {logoPreview ? (
                  <AvatarImage src={logoPreview} alt="Organization logo" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-[--color-accent-indigo] to-[--color-accent-purple]">
                  {watchedName ? (
                    getInitials(watchedName)
                  ) : (
                    <Building2 className="w-8 h-8" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="mt-2 text-xs text-[--color-label-tertiary]">
              Click to upload a logo (optional)
            </p>
          </div>

          {/* Organization Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Organization name</Label>
            <Input
              id="name"
              placeholder="Acme Inc."
              autoFocus
              variant={errors.name ? 'error' : 'default'}
              leftIcon={<Building2 className="w-4 h-4" />}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-[--color-accent-red]">
                {errors.name.message}
              </p>
            )}
            <p className="text-xs text-[--color-label-tertiary]">
              Pre-filled from your email domain. You can customize it.
            </p>
          </div>

          <CardFooter className="px-0 pb-0">
            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
