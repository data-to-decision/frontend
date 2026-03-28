'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Upload,
  Globe,
  Check,
  AlertTriangle,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Label,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
  Spinner,
} from '@d2d/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import {
  setCurrentOrganization,
  updateOrganization as updateOrganizationAction,
  setMembers,
  setSettings,
  setAuditLog,
} from '@/store/organization.slice';
import {
  initializeMockOrganization,
  updateOrganizationInfo,
  deleteOrganization as deleteMockOrganization,
  clearMockOrganization,
} from '@/lib/mock-organization';
import { simulateApiCall, getMockAuth, clearMockAuth } from '@/lib/mock-auth';
import { logout } from '@/store/auth.slice';
import { resetOnboarding } from '@/store/onboarding.slice';
import {
  getCurrentOrganization,
  getOrganization,
  updateOrganization as updateOrganizationApi,
  deleteOrganization as deleteOrganizationApi,
} from '@/lib/api/organizations';

// Check if mock auth is enabled
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentOrganization, isLoading: storeLoading } = useAppSelector((state) => state.organization);
  const { user } = useAppSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isLoadingOrg, setIsLoadingOrg] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const mockAuth = getMockAuth();
  const currentUser = user || mockAuth.user;
  const isOwner = currentUser?.organizationRole === 'owner';
  const canEdit = isOwner || currentUser?.organizationRole === 'admin';

  // Load organization data
  useEffect(() => {
    async function loadOrganization() {
      // If we have a current organization but it's missing domain info (from Sidebar's
      // listUserOrganizations which doesn't include domain), fetch the complete data
      const needsFullData = currentOrganization && currentOrganization.domain === null;

      // If we already have complete organization data from the store, skip fetching
      if (currentOrganization && !needsFullData) {
        setIsLoadingOrg(false);
        setLoadError(null);
        return;
      }

      setIsLoadingOrg(true);
      setLoadError(null);

      try {
        if (USE_MOCK_AUTH) {
          // Mock mode: use local storage
          const orgData = initializeMockOrganization();
          if (orgData.organizations.length > 0) {
            dispatch(setCurrentOrganization(orgData.organizations[0]));
            dispatch(setMembers(orgData.members));
            dispatch(setSettings(orgData.settings));
            dispatch(setAuditLog(orgData.auditLog));
          }
        } else {
          // API mode: fetch complete organization data
          // This is needed because listUserOrganizations() (used by Sidebar) doesn't
          // include the domain field, but this page needs it for display/editing
          let organization = null;

          if (currentOrganization?.id) {
            // We have an org ID from Sidebar - fetch complete data for this org
            organization = await getOrganization(currentOrganization.id);
          } else {
            // Fallback: fetch primary organization
            // Note: For personal email users who joined via invitation,
            // primary_organization_id may be null. In that case, the Sidebar
            // will set currentOrganization from listUserOrganizations().
            organization = await getCurrentOrganization();
          }

          if (organization) {
            dispatch(setCurrentOrganization(organization));
          }
          // Don't show error here - wait for Sidebar to potentially load the org
          // The Sidebar fetches orgs via listUserOrganizations() which includes
          // organizations joined via invitation
        }
      } catch (error) {
        // Only log, don't show error yet - Sidebar might set the org
        console.error('Failed to fetch organization:', error);
      } finally {
        setIsLoadingOrg(false);
      }
    }

    loadOrganization();
  }, [dispatch, currentOrganization]);

  // Update form fields when organization loads
  useEffect(() => {
    if (currentOrganization) {
      setName(currentOrganization.name);
      setDomain(currentOrganization.domain || '');
    }
  }, [currentOrganization]);

  const handleSave = async () => {
    if (!canEdit || !currentOrganization) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      if (USE_MOCK_AUTH) {
        // Mock mode: simulate API call and update local storage
        await simulateApiCall(null, 800);

        const updated = updateOrganizationInfo({ name, domain: domain || null });
        if (updated) {
          dispatch(updateOrganizationAction({ name, domain: domain || null }));
        }
      } else {
        // API mode: call the real API
        const updated = await updateOrganizationApi(currentOrganization.id, {
          name,
          domain: domain || null,
        });

        // Update Redux state with the response from the API
        dispatch(
          updateOrganizationAction({
            name: updated.name,
            domain: updated.domain,
          })
        );
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to save organization. Please try again.';
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!isOwner || !currentOrganization || deleteConfirmation !== currentOrganization.name) {
      setDeleteError(`Please type "${currentOrganization?.name}" to confirm`);
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (USE_MOCK_AUTH) {
        // Mock mode: simulate API call
        await simulateApiCall(null, 1500);
        clearMockOrganization();
      } else {
        // API mode: call the real API
        await deleteOrganizationApi(currentOrganization.id);
      }

      // Clear auth state and redirect
      dispatch(logout());
      dispatch(resetOnboarding());

      if (USE_MOCK_AUTH) {
        clearMockAuth();
      }

      router.push('/login');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to delete organization. Please try again.';
      setDeleteError(message);
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isLoadingOrg || storeLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <Card variant="outlined" padding="lg">
        <CardContent className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-[--color-accent-red] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[--color-label-primary] mb-2">
            Unable to Load Organization
          </h3>
          <p className="text-sm text-[--color-label-secondary] mb-4">{loadError}</p>
          <Button
            variant="gray"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No organization state
  if (!currentOrganization) {
    return (
      <Card variant="outlined" padding="lg">
        <CardContent className="text-center py-8">
          <Building2 className="w-12 h-12 text-[--color-label-tertiary] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[--color-label-primary] mb-2">
            No Organization
          </h3>
          <p className="text-sm text-[--color-label-secondary]">
            You are not currently part of any organization.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Info */}
      <Card variant="outlined" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Organization Information
          </CardTitle>
          <CardDescription>
            View and manage your organization details
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              {currentOrganization.logoUrl ? (
                <AvatarImage src={currentOrganization.logoUrl} alt={currentOrganization.name} />
              ) : (
                <AvatarFallback className="text-lg">
                  {getInitials(currentOrganization.name)}
                </AvatarFallback>
              )}
            </Avatar>
            {canEdit && (
              <div>
                <Button variant="gray" size="sm">
                  <Upload className="w-4 h-4" />
                  <span className="ml-1">Upload Logo</span>
                </Button>
                <p className="text-xs text-[--color-label-tertiary] mt-1">
                  Recommended: 256x256px, PNG or JPG
                </p>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corporation"
              disabled={!canEdit}
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="org-slug">Slug</Label>
            <Input
              id="org-slug"
              value={currentOrganization.slug}
              disabled
              className="bg-[--color-fill-primary]"
            />
            <p className="text-xs text-[--color-label-tertiary]">
              The slug cannot be changed after creation
            </p>
          </div>

          {/* Domain */}
          <div className="space-y-2">
            <Label htmlFor="org-domain">Domain</Label>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[--color-label-tertiary]" />
              <Input
                id="org-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="acme.com"
                disabled={!canEdit}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-[--color-label-tertiary]">
              Users with this email domain can request to join your organization
            </p>
          </div>
        </CardContent>

        {canEdit && (
          <CardFooter className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-sm text-[--color-accent-green]">
                <Check className="w-4 h-4" />
                Saved successfully
              </span>
            )}
            {errorMessage && (
              <span className="flex items-center gap-1 text-sm text-[--color-accent-red]">
                <AlertCircle className="w-4 h-4" />
                {errorMessage}
              </span>
            )}
          </CardFooter>
        )}
      </Card>

      {/* Danger Zone - Only for owners */}
      {isOwner && (
        <Card variant="outlined" padding="lg" className="border-[--color-accent-red]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[--color-accent-red]">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions for your organization
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="p-4 rounded-xl bg-[--color-accent-red]/5 border border-[--color-accent-red]/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[--color-label-primary]">
                    Delete Organization
                  </p>
                  <p className="text-xs text-[--color-label-secondary] mt-0.5 max-w-md">
                    Permanently delete this organization and all associated data.
                    All team members will be removed. This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="ml-1">Delete</span>
                </Button>
              </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteConfirmation('');
                    setDeleteError(null);
                  }}
                />
                <div className="relative bg-[--color-background-primary] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-[--color-separator]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[--color-accent-red]/10 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-[--color-accent-red]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[--color-label-primary]">
                        Delete Organization
                      </h3>
                      <p className="text-sm text-[--color-label-secondary]">
                        This action is permanent
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-[--color-accent-red]/5 border border-[--color-accent-red]/20">
                      <p className="text-sm text-[--color-label-primary]">
                        This will permanently delete:
                      </p>
                      <ul className="mt-2 text-xs text-[--color-label-secondary] space-y-1 ml-4 list-disc">
                        <li>All team members and their permissions</li>
                        <li>All data connections and credentials</li>
                        <li>All widgets, dashboards, and insights</li>
                        <li>All API keys and integrations</li>
                        <li>Billing and subscription information</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="delete-confirm">
                        Type <span className="font-mono font-semibold">{currentOrganization.name}</span> to confirm
                      </Label>
                      <Input
                        id="delete-confirm"
                        value={deleteConfirmation}
                        onChange={(e) => {
                          setDeleteConfirmation(e.target.value);
                          setDeleteError(null);
                        }}
                        placeholder={currentOrganization.name}
                        variant={deleteError ? 'error' : 'default'}
                      />
                      {deleteError && (
                        <p className="text-sm text-[--color-accent-red]">{deleteError}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        variant="destructive"
                        fullWidth
                        onClick={handleDeleteOrganization}
                        disabled={isDeleting || deleteConfirmation !== currentOrganization.name}
                      >
                        {isDeleting ? (
                          <>
                            <Spinner size="sm" />
                            <span className="ml-2">Deleting...</span>
                          </>
                        ) : (
                          'Delete Organization'
                        )}
                      </Button>
                      <Button
                        variant="gray"
                        fullWidth
                        onClick={() => {
                          setShowDeleteDialog(false);
                          setDeleteConfirmation('');
                          setDeleteError(null);
                        }}
                        disabled={isDeleting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
