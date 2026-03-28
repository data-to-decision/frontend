'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  ChevronLeft,
  Palette,
  Bell,
  Shield,
  HelpCircle,
  Users,
  UserCircle,
  Monitor,
  Activity,
  ChevronDown,
  Settings,
  FileText,
} from 'lucide-react';
import { Spinner } from '@d2d/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { setAuthenticated, setDomainSignup } from '@/store/auth.slice';
import { getMockAuth } from '@/lib/mock-auth';
import { Sidebar } from '@/components/layout';
import { hasStoredSession } from '@/lib/auth/tokens';
import { getCurrentUser } from '@/lib/api/auth';

// Check if mock auth is enabled
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

interface SettingsSection {
  id: string;
  icon: React.ElementType;
  label: string;
  href: string;
  description: string;
  adminOnly?: boolean;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'appearance', icon: Palette, label: 'Appearance', href: '/settings', description: 'Theme and display preferences' },
  { id: 'profile', icon: UserCircle, label: 'Profile', href: '/settings/profile', description: 'Your personal information' },
  { id: 'team', icon: Users, label: 'Team', href: '/settings/team', description: 'Manage team members' },
  { id: 'notifications', icon: Bell, label: 'Notifications', href: '/settings/notifications', description: 'Email and push notifications' },
  { id: 'security', icon: Shield, label: 'Security', href: '/settings/security', description: 'Password and two-factor auth' },
  { id: 'sessions', icon: Monitor, label: 'Sessions', href: '/settings/sessions', description: 'Manage active sessions' },
  { id: 'activity', icon: Activity, label: 'Activity', href: '/settings/activity', description: 'View your activity log' },
  { id: 'help', icon: HelpCircle, label: 'Help & Support', href: '/settings/help', description: 'Documentation and support' },
];

const ORGANIZATION_SECTIONS: SettingsSection[] = [
  { id: 'organization', icon: Building2, label: 'General', href: '/settings/organization', description: 'Organization info' },
  { id: 'org-members', icon: Users, label: 'Members', href: '/settings/organization/members', description: 'Manage organization members' },
  { id: 'org-settings', icon: Settings, label: 'Settings', href: '/settings/organization/settings', description: 'Organization settings', adminOnly: true },
  { id: 'org-audit', icon: FileText, label: 'Audit Log', href: '/settings/organization/audit', description: 'View audit log', adminOnly: true },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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

      // Only set authenticated state AFTER successful auth check
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

    // Only set authenticated state AFTER successful auth check
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
  const organizationName =
    domainSignup?.organization?.name || mockAuth.domainSignup?.organization?.name;

  // Determine active section from pathname
  const getActiveSection = () => {
    if (pathname === '/settings') return 'appearance';

    // Check organization sections first (more specific paths)
    const orgSection = ORGANIZATION_SECTIONS.find((s) => pathname === s.href);
    if (orgSection) return orgSection.id;

    const section = SETTINGS_SECTIONS.find((s) => pathname === s.href);
    return section?.id || 'appearance';
  };

  const activeSection = getActiveSection();
  const isOrgSectionActive = ORGANIZATION_SECTIONS.some((s) => s.id === activeSection);
  const [orgSectionExpanded, setOrgSectionExpanded] = useState(isOrgSectionActive);

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
        <div className="p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-[--color-label-secondary] hover:text-[--color-label-primary] transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Canvas
            </Link>
            <h1 className="text-2xl font-semibold text-[--color-label-primary]">
              Settings
            </h1>
            <p className="text-[--color-label-secondary] mt-1">
              Manage your account preferences and settings
            </p>
          </div>

          <div className="flex gap-8">
            {/* Settings Navigation */}
            <div className="w-56 shrink-0">
              <nav className="space-y-1">
                {SETTINGS_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <Link
                      key={section.id}
                      href={section.href}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                        isActive
                          ? 'bg-[--color-accent-blue]/10 text-[--color-accent-blue] font-medium'
                          : 'text-[--color-label-secondary] hover:bg-[--color-fill-primary] hover:text-[--color-label-primary]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {section.label}
                    </Link>
                  );
                })}

                {/* Organization Section */}
                {organizationName && (
                  <>
                    <div className="pt-4 pb-2">
                      <button
                        onClick={() => setOrgSectionExpanded(!orgSectionExpanded)}
                        className="w-full flex items-center justify-between px-3 py-1 text-xs font-medium text-[--color-label-tertiary] uppercase tracking-wider hover:text-[--color-label-secondary] transition-colors"
                      >
                        <span>Organization</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            orgSectionExpanded ? '' : '-rotate-90'
                          }`}
                        />
                      </button>
                    </div>
                    {orgSectionExpanded && (
                      <div className="space-y-1">
                        {ORGANIZATION_SECTIONS
                          .filter((section) => {
                            // Filter out admin-only sections for non-admin users
                            if (section.adminOnly) {
                              const userRole = user?.organizationRole;
                              return userRole === 'owner' || userRole === 'admin';
                            }
                            return true;
                          })
                          .map((section) => {
                          const Icon = section.icon;
                          const isActive = activeSection === section.id;

                          return (
                            <Link
                              key={section.id}
                              href={section.href}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                                isActive
                                  ? 'bg-[--color-accent-blue]/10 text-[--color-accent-blue] font-medium'
                                  : 'text-[--color-label-secondary] hover:bg-[--color-fill-primary] hover:text-[--color-label-primary]'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                              {section.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="flex-1">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
