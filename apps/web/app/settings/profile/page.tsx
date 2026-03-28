'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserCircle,
  User,
  Camera,
  Briefcase,
  Globe,
  Check,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
import { getMockAuth, setMockAuth, simulateApiCall } from '@/lib/mock-auth';
import { updateCurrentUser, getCurrentUser } from '@/lib/api/auth';

// Check if mock auth is enabled
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

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

const TIMEZONES = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore Time (SGT)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Pacific/Auckland', label: 'New Zealand (NZST)' },
];

const PROFILE_STORAGE_KEY = 'd2d_profile_settings';

interface ProfileSettingsData {
  jobTitle: string;
  timezone: string;
}

function getStoredProfileSettings(): ProfileSettingsData {
  if (typeof window === 'undefined') {
    return { jobTitle: '', timezone: '' };
  }
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { jobTitle: '', timezone: '' };
  } catch {
    return { jobTitle: '', timezone: '' };
  }
}

function setStoredProfileSettings(data: Partial<ProfileSettingsData>) {
  if (typeof window === 'undefined') return;
  const current = getStoredProfileSettings();
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...current, ...data }));
}

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  jobTitle: z.string().optional(),
  timezone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfileSettingsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(!USE_MOCK_AUTH);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mockAuth = getMockAuth();
  const displayUser = user || mockAuth.user;
  const storedSettings = getStoredProfileSettings();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: displayUser?.name || '',
      jobTitle: storedSettings.jobTitle || '',
      timezone: storedSettings.timezone || displayUser?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  // Fetch current user data from API on mount
  useEffect(() => {
    if (USE_MOCK_AUTH) {
      return;
    }

    const fetchUserData = async () => {
      try {
        setIsLoadingInitialData(true);
        const userData = await getCurrentUser();

        // Update Redux with the fetched user data
        dispatch(updateUser(userData));

        // Reset form with API data
        const localSettings = getStoredProfileSettings();
        reset({
          name: userData.name || '',
          jobTitle: localSettings.jobTitle || '',
          timezone: userData.timezone || localSettings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        // Set avatar preview from API data
        setAvatarPreview(userData.avatarUrl);
        setAvatarRemoved(false);
      } catch (error) {
        // If fetch fails, use existing Redux state
        console.error('Failed to fetch user data:', error);
      } finally {
        setIsLoadingInitialData(false);
      }
    };

    fetchUserData();
  }, [dispatch, reset]);

  // Initialize avatar preview from Redux state (for mock mode or if API fetch hasn't happened)
  useEffect(() => {
    if (USE_MOCK_AUTH && displayUser?.avatarUrl) {
      setAvatarPreview(displayUser.avatarUrl);
    }
  }, [displayUser?.avatarUrl]);

  const watchedName = watch('name');
  const watchedJobTitle = watch('jobTitle');
  const watchedTimezone = watch('timezone');

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setAvatarRemoved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    // Clear any previous error
    setErrorMessage(null);

    try {
      if (USE_MOCK_AUTH) {
        // Mock mode: simulate API call and update mock storage
        await simulateApiCall(data, 800);

        // Update Redux state
        dispatch(
          updateUser({
            name: data.name,
            avatarUrl: avatarPreview,
            timezone: data.timezone || null,
          })
        );

        // Update mock storage
        const mockAuth = getMockAuth();
        if (mockAuth.user) {
          setMockAuth({
            user: {
              ...mockAuth.user,
              name: data.name,
              avatarUrl: avatarPreview,
            },
          });
        }

        // Store job title and timezone separately (mock mode only)
        setStoredProfileSettings({
          jobTitle: data.jobTitle,
          timezone: data.timezone,
        });
      } else {
        // API mode: call the real API
        // When avatar is removed (avatarPreview is null and avatarRemoved is true),
        // explicitly send null to clear it on the backend
        const avatarUrlToSend = avatarRemoved ? null : avatarPreview;

        const updatedUser = await updateCurrentUser({
          name: data.name,
          display_name: data.name, // Use name as display_name
          avatar_url: avatarUrlToSend,
          timezone: data.timezone || null,
        });

        // Update Redux state with ALL fields from the API response
        dispatch(
          updateUser({
            name: updatedUser.name,
            displayName: updatedUser.displayName,
            avatarUrl: updatedUser.avatarUrl,
            timezone: updatedUser.timezone,
            updatedAt: updatedUser.updatedAt,
            onboardingComplete: updatedUser.onboardingComplete,
            onboardingStatus: updatedUser.onboardingStatus,
          })
        );

        // Update local avatar state to match API response
        setAvatarPreview(updatedUser.avatarUrl);
        setAvatarRemoved(false);

        // Also store job title locally (not part of API)
        setStoredProfileSettings({
          jobTitle: data.jobTitle,
          timezone: data.timezone,
        });
      }

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reset form dirty state
      reset(data);
    } catch (error) {
      // Handle API errors gracefully
      const message = error instanceof Error
        ? error.message
        : 'Failed to update profile. Please try again.';
      setErrorMessage(message);

      // Auto-clear error after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  // Show loading state while fetching initial data
  if (isLoadingInitialData) {
    return (
      <Card variant="outlined" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Manage your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[--color-label-tertiary]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" padding="lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="w-5 h-5" />
          Profile
        </CardTitle>
        <CardDescription>
          Manage your personal information and preferences
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-6">
            <div className="relative">
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
                    {watchedName ? (
                      getInitials(watchedName)
                    ) : (
                      <User className="w-8 h-8" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[--color-accent-red] text-white flex items-center justify-center hover:bg-[--color-accent-red]/80 transition-colors"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAvatarClick}
              >
                <Camera className="w-4 h-4" />
                Change photo
              </Button>
              <p className="mt-2 text-xs text-[--color-label-tertiary]">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-[--color-separator]" />

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              autoComplete="name"
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
            <Label htmlFor="jobTitle">Job title</Label>
            <Select
              value={watchedJobTitle}
              onValueChange={(value) => setValue('jobTitle', value, { shouldDirty: true })}
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
            <p className="text-xs text-[--color-label-tertiary]">
              This helps us personalize your experience
            </p>
          </div>

          {/* Timezone Select */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={watchedTimezone}
              onValueChange={(value) => setValue('timezone', value, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[--color-label-tertiary]">
              Used for scheduling and displaying times
            </p>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={displayUser?.email || ''}
              disabled
              className="bg-[--color-fill-secondary] cursor-not-allowed"
            />
            <p className="text-xs text-[--color-label-tertiary]">
              Contact support to change your email address
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!isDirty && !avatarRemoved && avatarPreview === displayUser?.avatarUrl}
            >
              Save changes
            </Button>

            {/* Success Message */}
            {showSuccess && (
              <div className="flex items-center gap-2 text-sm text-[--color-accent-green] animate-fade-in">
                <Check className="w-4 h-4" />
                Profile updated successfully
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-2 text-sm text-[--color-accent-red] animate-fade-in">
                <AlertCircle className="w-4 h-4" />
                {errorMessage}
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
