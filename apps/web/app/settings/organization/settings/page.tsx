'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Globe,
  Shield,
  Clock,
  Check,
  Plus,
  X,
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Spinner,
} from '@d2d/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import {
  setCurrentOrganization,
  setMembers,
  setSettings,
  setAuditLog,
  updateSettings as updateSettingsAction,
} from '@/store/organization.slice';
import {
  initializeMockOrganization,
  updateOrgSettings,
} from '@/lib/mock-organization';
import { simulateApiCall, getMockAuth } from '@/lib/mock-auth';
import { getOrganizationSettings, updateOrganizationSettings } from '@/lib/api';
import type { OrganizationSettings } from '@d2d/types';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

const TIMEZONES = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'UTC', label: 'UTC' },
];

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[--color-accent-blue] focus:ring-offset-2 ${
        checked ? 'bg-[--color-accent-blue]' : 'bg-[--color-fill-tertiary]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function OrganizationSettingsSettingsPage() {
  const dispatch = useAppDispatch();
  const { settings, isLoading, currentOrganization } = useAppSelector((state) => state.organization);
  const { user } = useAppSelector((state) => state.auth);

  const [localSettings, setLocalSettings] = useState<OrganizationSettings | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const mockAuth = getMockAuth();
  const currentUser = user || mockAuth.user;
  const canEdit = currentUser?.organizationRole === 'owner' || currentUser?.organizationRole === 'admin';

  useEffect(() => {
    const loadSettings = async () => {
      if (USE_MOCK_AUTH) {
        // Mock mode - use local mock data
        const orgData = initializeMockOrganization();
        if (orgData.organizations.length > 0) {
          dispatch(setCurrentOrganization(orgData.organizations[0]));
          dispatch(setMembers(orgData.members));
          dispatch(setSettings(orgData.settings));
          dispatch(setAuditLog(orgData.auditLog));
        }
      } else {
        // API mode - fetch settings from real API
        // Get organization ID from Redux state or user context
        const orgId = currentOrganization?.id;
        if (orgId) {
          try {
            const apiSettings = await getOrganizationSettings(orgId);
            dispatch(setSettings(apiSettings));
          } catch (error) {
            console.error('Failed to load organization settings:', error);
          }
        }
      }
    };

    loadSettings();
  }, [dispatch, currentOrganization?.id]);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!canEdit || !localSettings) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      if (USE_MOCK_AUTH) {
        // Mock mode - use local mock data
        await simulateApiCall(null, 800);
        const updated = updateOrgSettings(localSettings);
        dispatch(updateSettingsAction(updated));
      } else {
        // API mode - call real API to update settings
        const orgId = currentOrganization?.id;
        if (!orgId) {
          throw new Error('No organization selected');
        }
        const updated = await updateOrganizationSettings(orgId, localSettings);
        dispatch(updateSettingsAction(updated));
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save organization settings:', error);
      // Could add error state handling here
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDomain = () => {
    if (!newDomain || !localSettings) return;

    const domain = newDomain.toLowerCase().trim();
    if (!localSettings.domainRestrictions.includes(domain)) {
      setLocalSettings({
        ...localSettings,
        domainRestrictions: [...localSettings.domainRestrictions, domain],
      });
    }
    setNewDomain('');
  };

  const handleRemoveDomain = (domain: string) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      domainRestrictions: localSettings.domainRestrictions.filter((d) => d !== domain),
    });
  };

  if (isLoading || !localSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card variant="outlined" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Organization Settings
          </CardTitle>
          <CardDescription>
            Configure your organization preferences
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Default Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Default Timezone</Label>
            <Select
              value={localSettings.defaultTimezone}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, defaultTimezone: value })
              }
              disabled={!canEdit}
            >
              <SelectTrigger className="w-full">
                <Clock className="w-4 h-4 mr-2" />
                <SelectValue />
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
              Default timezone for all scheduled reports and notifications
            </p>
          </div>

          {/* Allow Join Requests */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[--color-fill-primary] border border-[--color-separator]">
            <div>
              <p className="text-sm font-medium text-[--color-label-primary]">
                Allow Join Requests
              </p>
              <p className="text-xs text-[--color-label-tertiary] mt-0.5">
                Users with matching email domains can request to join
              </p>
            </div>
            <ToggleSwitch
              checked={localSettings.allowJoinRequests}
              onChange={(checked) =>
                setLocalSettings({ ...localSettings, allowJoinRequests: checked })
              }
              disabled={!canEdit}
            />
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
          </CardFooter>
        )}
      </Card>

      {/* Domain Restrictions */}
      <Card variant="outlined" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Domain Restrictions
          </CardTitle>
          <CardDescription>
            Restrict which email domains can join your organization
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {canEdit && (
            <div className="flex items-center gap-2">
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com"
                onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
              />
              <Button variant="gray" onClick={handleAddDomain}>
                <Plus className="w-4 h-4" />
                <span className="ml-1">Add</span>
              </Button>
            </div>
          )}

          {localSettings.domainRestrictions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {localSettings.domainRestrictions.map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[--color-fill-primary] border border-[--color-separator] text-sm"
                >
                  <Globe className="w-3.5 h-3.5 text-[--color-label-tertiary]" />
                  {domain}
                  {canEdit && (
                    <button
                      onClick={() => handleRemoveDomain(domain)}
                      className="ml-1 text-[--color-label-tertiary] hover:text-[--color-accent-red] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[--color-label-tertiary]">
              No domain restrictions. Anyone can request to join.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card variant="outlined" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure security requirements for your organization
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-[--color-fill-primary] border border-[--color-separator]">
            <div>
              <p className="text-sm font-medium text-[--color-label-primary]">
                Require Two-Factor Authentication
              </p>
              <p className="text-xs text-[--color-label-tertiary] mt-0.5">
                All members must enable 2FA to access the organization
              </p>
            </div>
            <ToggleSwitch
              checked={localSettings.mfaRequired}
              onChange={(checked) =>
                setLocalSettings({ ...localSettings, mfaRequired: checked })
              }
              disabled={!canEdit}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
