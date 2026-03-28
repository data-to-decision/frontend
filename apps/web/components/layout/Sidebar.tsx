'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Layers,
  LayoutDashboard,
  Database,
  Sparkles,
  Bot,
  Settings,
  LogOut,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  CreditCard,
  FileText,
  ChevronDown,
  Check,
  Mail,
} from 'lucide-react';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from '@d2d/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { logout, setAuthenticated, setDomainSignup } from '@/store/auth.slice';
import { resetOnboarding } from '@/store/onboarding.slice';
import { setOrganizations, setCurrentOrganization } from '@/store/organization.slice';
import { toggleCollapsed, initializeSidebar } from '@/store/sidebar.slice';
import { clearMockAuth, getMockAuth } from '@/lib/mock-auth';
import { listUserOrganizations, getPendingInvitations, OrganizationMembership } from '@/lib/api';

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Canvas', href: '/' },
  { icon: Database, label: 'Connections', href: '/connections' },
  { icon: Sparkles, label: 'Insights', href: '/insights' },
  { icon: Bot, label: 'Agents', href: '/agents' },
];

interface UserDropdownItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
  divider?: boolean;
  external?: boolean;
}

// LocalStorage key for selected organization
const SELECTED_ORG_KEY = 'd2d_selected_org';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user, domainSignup } = useAppSelector((state) => state.auth);
  const { organizations, currentOrganization } = useAppSelector((state) => state.organization);
  const { isCollapsed } = useAppSelector((state) => state.sidebar);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const orgDropdownRef = useRef<HTMLDivElement>(null);
  // Ref to ensure mock auth sync only runs once on mount
  const hasSyncedMockAuth = useRef(false);

  useEffect(() => {
    dispatch(initializeSidebar());
  }, [dispatch]);

  // Fetch user organizations
  const fetchOrganizations = useCallback(async () => {
    try {
      const orgs = await listUserOrganizations();
      // Convert OrganizationMembership to Organization format for the store
      const orgList = orgs.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl,
        domain: null, // Not returned in membership response
        createdAt: org.createdAt,
        updatedAt: org.createdAt, // Use createdAt as fallback
      }));
      dispatch(setOrganizations(orgList));

      // Restore selected organization from localStorage or use default
      const savedOrgId = localStorage.getItem(SELECTED_ORG_KEY);
      const savedOrg = savedOrgId ? orgList.find((o) => o.id === savedOrgId) : null;
      const defaultOrg = orgs.find((o) => o.isDefaultOrg);
      const selectedOrg = savedOrg || (defaultOrg ? orgList.find((o) => o.id === defaultOrg.id) : null) || orgList[0];

      if (selectedOrg) {
        dispatch(setCurrentOrganization(selectedOrg));
        localStorage.setItem(SELECTED_ORG_KEY, selectedOrg.id);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  }, [dispatch]);

  // Fetch organizations when user is authenticated and on route change
  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user, pathname, fetchOrganizations]);

  // Fetch pending invitations count
  const fetchPendingInvitations = useCallback(async () => {
    try {
      const pending = await getPendingInvitations();
      setPendingInvitationsCount(pending.length);
    } catch (err) {
      // Ignore errors - user may not be logged in or endpoint may not exist yet
      console.debug('Failed to fetch pending invitations:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchPendingInvitations();
    }
  }, [user, fetchPendingInvitations]);

  useEffect(() => {
    // Only sync mock auth once on mount to avoid reading stale localStorage values
    if (hasSyncedMockAuth.current) return;
    hasSyncedMockAuth.current = true;

    const mockAuth = getMockAuth();
    if (mockAuth.user) {
      dispatch(setAuthenticated(mockAuth.user));
      if (mockAuth.domainSignup) {
        dispatch(setDomainSignup(mockAuth.domainSignup));
      }
    }
  }, [dispatch]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) {
        setShowOrgDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle organization switch
  const handleOrgSwitch = (org: typeof organizations[0]) => {
    dispatch(setCurrentOrganization(org));
    localStorage.setItem(SELECTED_ORG_KEY, org.id);
    setShowOrgDropdown(false);
    // Optionally refresh the page to reload org-specific data
    // router.refresh();
  };

  const handleSignOut = () => {
    dispatch(logout());
    dispatch(resetOnboarding());
    clearMockAuth();
    router.push('/login');
  };

  const handleToggleCollapse = () => {
    dispatch(toggleCollapsed());
  };

  const mockAuth = getMockAuth();
  const displayUser = user || mockAuth.user;
  const displayName = displayUser?.name?.split(' ')[0] || 'there';
  const organizationName =
    domainSignup?.organization?.name || mockAuth.domainSignup?.organization?.name;

  const isActiveRoute = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const userDropdownItems: UserDropdownItem[] = [
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: FileText, label: 'Privacy Policy', href: '/privacy', external: true },
    { icon: HelpCircle, label: 'Help & Support', href: '/settings/help' },
    { icon: CreditCard, label: 'Manage Subscription', href: '/settings/billing' },
    { icon: LogOut, label: 'Sign Out', onClick: handleSignOut, divider: true },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } border-r border-[--color-separator] bg-[--color-background-secondary] flex flex-col transition-all duration-200 ease-in-out sticky top-0 h-screen shrink-0`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-[--color-separator]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[--color-accent-blue] to-[--color-accent-purple] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-[--color-label-primary] truncate">
              Data2Decision
            </span>
          )}
        </div>
      </div>

      {/* Organization switcher */}
      {(currentOrganization || organizationName) && !isCollapsed && (
        <div className="px-2 py-2 border-b border-[--color-separator]" ref={orgDropdownRef}>
          <div className="relative">
            <button
              onClick={() => organizations.length > 1 && setShowOrgDropdown(!showOrgDropdown)}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
                organizations.length > 1
                  ? 'hover:bg-[--color-fill-primary] cursor-pointer'
                  : 'cursor-default'
              }`}
            >
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[--color-accent-indigo] to-[--color-accent-purple] flex items-center justify-center shrink-0">
                {currentOrganization?.logoUrl ? (
                  <img
                    src={currentOrganization.logoUrl}
                    alt={currentOrganization.name}
                    className="w-6 h-6 rounded-md object-cover"
                  />
                ) : (
                  <span className="text-white text-xs font-medium">
                    {(currentOrganization?.name || organizationName || '?').slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="font-medium text-[--color-label-primary] truncate flex-1 text-left">
                {currentOrganization?.name || organizationName}
              </span>
              {organizations.length > 1 && (
                <ChevronDown
                  className={`w-4 h-4 text-[--color-label-tertiary] transition-transform ${
                    showOrgDropdown ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>

            {/* Organization dropdown */}
            {showOrgDropdown && organizations.length > 1 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[--color-background-elevated] rounded-xl shadow-lg border border-[--color-separator] py-1 z-50 max-h-64 overflow-y-auto">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleOrgSwitch(org)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      currentOrganization?.id === org.id
                        ? 'bg-[--color-accent-blue]/10 text-[--color-accent-blue]'
                        : 'text-[--color-label-secondary] hover:bg-[--color-fill-primary] hover:text-[--color-label-primary]'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[--color-accent-indigo] to-[--color-accent-purple] flex items-center justify-center shrink-0">
                      {org.logoUrl ? (
                        <img
                          src={org.logoUrl}
                          alt={org.name}
                          className="w-6 h-6 rounded-md object-cover"
                        />
                      ) : (
                        <span className="text-white text-xs font-medium">
                          {org.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="truncate flex-1 text-left">{org.name}</span>
                    {currentOrganization?.id === org.id && (
                      <Check className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsed organization indicator */}
      {(currentOrganization || organizationName) && isCollapsed && (
        <div className="px-2 py-2 border-b border-[--color-separator] flex justify-center">
          <div
            className="w-8 h-8 rounded-md bg-gradient-to-br from-[--color-accent-indigo] to-[--color-accent-purple] flex items-center justify-center"
            title={currentOrganization?.name || organizationName}
          >
            {currentOrganization?.logoUrl ? (
              <img
                src={currentOrganization.logoUrl}
                alt={currentOrganization.name}
                className="w-8 h-8 rounded-md object-cover"
              />
            ) : (
              <span className="text-white text-sm font-medium">
                {(currentOrganization?.name || organizationName || '?').slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Pending Invitations Notification */}
      {pendingInvitationsCount > 0 && (
        <div className="px-2 py-2 border-b border-[--color-separator]">
          <Link
            href="/invitations"
            title={isCollapsed ? `${pendingInvitationsCount} pending invitation${pendingInvitationsCount > 1 ? 's' : ''}` : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors bg-[--color-accent-orange]/10 text-[--color-accent-orange] hover:bg-[--color-accent-orange]/20 ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="relative">
              <Mail className="w-5 h-5 shrink-0" />
              {isCollapsed && (
                <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-[--color-accent-red] text-white text-[10px] font-medium">
                  {pendingInvitationsCount > 9 ? '9+' : pendingInvitationsCount}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <>
                <span className="flex-1">Invitations</span>
                <span className="px-1.5 py-0.5 rounded-full bg-[--color-accent-red] text-white text-xs font-medium">
                  {pendingInvitationsCount}
                </span>
              </>
            )}
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[--color-accent-blue]/10 text-[--color-accent-blue] font-medium'
                  : 'text-[--color-label-secondary] hover:bg-[--color-fill-primary] hover:text-[--color-label-primary]'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 pb-2">
        <button
          onClick={handleToggleCollapse}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-[--color-label-tertiary] hover:bg-[--color-fill-primary] hover:text-[--color-label-primary] transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* User section with dropdown */}
      <div className="p-2 border-t border-[--color-separator]" ref={dropdownRef}>
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[--color-fill-primary] transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <Avatar size="sm">
              {displayUser?.avatarUrl && (
                <AvatarImage src={displayUser.avatarUrl} alt={displayName} />
              )}
              <AvatarFallback>
                {displayUser?.name ? (
                  getInitials(displayUser.name)
                ) : (
                  <User className="w-4 h-4" />
                )}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-[--color-label-primary] truncate">
                    {displayUser?.name || 'User'}
                  </p>
                  <p className="text-xs text-[--color-label-tertiary] truncate">
                    {displayUser?.email}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[--color-label-tertiary] transition-transform ${
                    showUserDropdown ? 'rotate-180' : ''
                  }`}
                />
              </>
            )}
          </button>

          {/* Dropdown menu */}
          {showUserDropdown && (
            <div
              className={`absolute ${
                isCollapsed ? 'left-full ml-2' : 'left-0 right-0'
              } bottom-full mb-2 bg-[--color-background-elevated] rounded-xl shadow-lg border border-[--color-separator] py-1 z-50 min-w-[200px]`}
            >
              {/* User info header */}
              <div className="px-3 py-2 border-b border-[--color-separator]">
                <p className="text-sm font-medium text-[--color-label-primary] truncate">
                  {displayUser?.name || 'User'}
                </p>
                <p className="text-xs text-[--color-label-tertiary] truncate">
                  {displayUser?.email}
                </p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                {userDropdownItems.map((item, index) => {
                  const Icon = item.icon;

                  if (item.divider) {
                    return (
                      <div key={`divider-${index}`}>
                        <div className="my-1 border-t border-[--color-separator]" />
                        {item.onClick ? (
                          <button
                            onClick={() => {
                              item.onClick?.();
                              setShowUserDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[--color-accent-red] hover:bg-[--color-accent-red]/10 transition-colors"
                          >
                            <Icon className="w-4 h-4" />
                            {item.label}
                          </button>
                        ) : (
                          <Link
                            href={item.href || '#'}
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm text-[--color-accent-red] hover:bg-[--color-accent-red]/10 transition-colors"
                          >
                            <Icon className="w-4 h-4" />
                            {item.label}
                          </Link>
                        )}
                      </div>
                    );
                  }

                  if (item.onClick) {
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.onClick?.();
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[--color-label-secondary] hover:bg-[--color-fill-primary] hover:text-[--color-label-primary] transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.label}
                      href={item.href || '#'}
                      onClick={() => setShowUserDropdown(false)}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noopener noreferrer' : undefined}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-[--color-label-secondary] hover:bg-[--color-fill-primary] hover:text-[--color-label-primary] transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                      {item.external && (
                        <span className="ml-auto text-[--color-label-tertiary]">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
