'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Camera, ArrowRight, Briefcase } from 'lucide-react';
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
  getInitials,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
} from '@d2d/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { updateUser } from '@/store/auth.slice';
import { updateProfileData, setCurrentStep } from '@/store/onboarding.slice';
import { setMockAuth, getMockAuth, simulateApiCall } from '@/lib/mock-auth';
import { updateCurrentUser } from '@/lib/api/auth';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

// Local storage key for profile settings (shared with settings/profile page)
const PROFILE_STORAGE_KEY = 'd2d_profile_settings';

/**
 * Store profile settings to localStorage for persistence across sessions
 * (Job title is not supported by backend yet, so we store it locally)
 */
function setStoredProfileSettings(data: { jobTitle?: string; timezone?: string }) {
  if (typeof window === 'undefined') return;
  try {
    const current = localStorage.getItem(PROFILE_STORAGE_KEY);
    const existing = current ? JSON.parse(current) : {};
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...existing, ...data }));
  } catch {
    // Ignore localStorage errors
  }
}

const JOB_TITLES = [
  { value: 'ceo', label: 'CEO / Founder' },
  { value: 'cto', label: 'CTO / Technical Lead' },
  { value: 'cfo', label: 'CFO / Finance' },
  { value: 'vp', label: 'VP / Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'designer', label: 'Designer' },
  { value: 'other', label: 'Other' },
];

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  jobTitle: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, domainSignup } = useAppSelector((state) => state.auth);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      jobTitle: '',
    },
  });

  const watchedName = watch('name');
  const watchedJobTitle = watch('jobTitle');

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    try {
      if (USE_MOCK_AUTH) {
        // Simulate API call in mock mode
        await simulateApiCall(data);
      } else {
        // Call the real API to update profile
        // The backend automatically updates onboarding_status when profile is completed
        const updatedUser = await updateCurrentUser({
          name: data.name,
          display_name: data.name, // Use name as display name if not provided separately
          avatar_url: avatarPreview,
        });

        // Update Redux with the response from the server
        dispatch(updateUser(updatedUser));
      }

      // Update Redux state for local UI (onboarding-specific profile data)
      dispatch(
        updateProfileData({
          name: data.name,
          jobTitle: data.jobTitle || null,
          avatarUrl: avatarPreview,
        })
      );

      // Update mock storage (for mock mode)
      if (USE_MOCK_AUTH) {
        const mockAuth = getMockAuth();
        if (mockAuth.user) {
          // For work email users creating org, set pending_org; otherwise set completed
          const isOrgCreator = domainSignup?.action === 'organization_created';
          setMockAuth({
            user: {
              ...mockAuth.user,
              name: data.name,
              avatarUrl: avatarPreview,
              onboardingComplete: !isOrgCreator,
              onboardingStatus: isOrgCreator ? 'pending_org' : 'completed',
            },
          });
        }
      }

      // Store job title to localStorage (backend doesn't support job_title yet)
      // This allows the settings/profile page to read it
      if (data.jobTitle) {
        setStoredProfileSettings({ jobTitle: data.jobTitle });
      }

      // Determine next step
      if (domainSignup?.action === 'organization_created') {
        dispatch(setCurrentStep('organization'));
        router.push('/organization');
      } else {
        // Personal user or existing org - complete onboarding
        // Check for returnUrl (e.g., invitation page) and redirect there
        const mockAuth = getMockAuth();
        const storedReturnUrl = mockAuth.returnUrl;
        if (storedReturnUrl) {
          setMockAuth({ returnUrl: null });
        }
        router.push(storedReturnUrl || '/');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      // The form will show an error state via isSubmitting
    }
  };

  return (
    <Card variant="elevated" padding="lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Complete your profile</CardTitle>
        <CardDescription className="mt-2">
          Tell us a bit about yourself to personalize your experience
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="relative group"
            >
              <Avatar size="xl">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt="Profile" />
                ) : null}
                <AvatarFallback>
                  {watchedName ? getInitials(watchedName) : <User className="w-8 h-8" />}
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
              Click to upload a photo
            </p>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              autoComplete="name"
              autoFocus
              variant={errors.name ? 'error' : 'default'}
              leftIcon={<User className="w-4 h-4" />}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-[--color-accent-red]">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Job Title Select */}
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job title (optional)</Label>
            <Select
              value={watchedJobTitle}
              onValueChange={(value) => setValue('jobTitle', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {JOB_TITLES.map((job) => (
                  <SelectItem key={job.value} value={job.value}>
                    {job.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <CardFooter className="px-0 pb-0">
            <Button type="submit" fullWidth isLoading={isSubmitting}>
              {domainSignup?.action === 'organization_created'
                ? 'Continue to organization setup'
                : 'Complete setup'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
