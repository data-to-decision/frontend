'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Label,
  Spinner,
} from '@d2d/ui';
import { useAppDispatch } from '@/hooks/useStore';
import { logout } from '@/store/auth.slice';
import { resetOnboarding } from '@/store/onboarding.slice';
import { clearMockAuth, simulateApiCall } from '@/lib/mock-auth';
import { deactivateAccount, ApiError } from '@/lib/api';
import { clearTokens } from '@/lib/auth/tokens';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [deactivateConfirmation, setDeactivateConfirmation] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const handleDeactivateAccount = async () => {
    if (deactivateConfirmation !== 'DEACTIVATE') {
      setDeactivateError('Please type DEACTIVATE to confirm');
      return;
    }

    setIsDeactivating(true);
    setDeactivateError(null);

    try {
      if (USE_MOCK_AUTH) {
        // Mock mode: simulate API delay
        await simulateApiCall(null, 1500);
      } else {
        // Real API: call deactivate endpoint
        await deactivateAccount();
      }

      // Clear all auth data
      dispatch(logout());
      dispatch(resetOnboarding());
      clearMockAuth();
      clearTokens();

      // Redirect to login with message
      router.push('/login?deactivated=true');
    } catch (error) {
      setIsDeactivating(false);
      if (error instanceof ApiError) {
        setDeactivateError(error.userMessage);
      } else {
        setDeactivateError('Failed to deactivate account. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <Card variant="outlined" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-[--color-fill-primary] border border-[--color-separator]">
            <div>
              <p className="text-sm font-medium text-[--color-label-primary]">
                Authenticator App
              </p>
              <p className="text-xs text-[--color-label-tertiary] mt-0.5">
                Use an authenticator app to generate one-time codes
              </p>
            </div>
            <Button variant="filled" size="sm">
              Enable
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card variant="outlined" padding="lg" className="border-[--color-accent-red]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[--color-accent-red]">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="p-4 rounded-xl bg-[--color-accent-red]/5 border border-[--color-accent-red]/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[--color-label-primary]">
                  Deactivate Account
                </p>
                <p className="text-xs text-[--color-label-secondary] mt-0.5 max-w-md">
                  Permanently deactivate your account and delete all associated data.
                  This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeactivateDialog(true)}
              >
                Deactivate
              </Button>
            </div>
          </div>

          {/* Deactivate Confirmation Dialog */}
          {showDeactivateDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => {
                  setShowDeactivateDialog(false);
                  setDeactivateConfirmation('');
                  setDeactivateError(null);
                }}
              />
              <div className="relative bg-[--color-background-primary] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-[--color-separator]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[--color-accent-red]/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-[--color-accent-red]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[--color-label-primary]">
                      Deactivate Account
                    </h3>
                    <p className="text-sm text-[--color-label-secondary]">
                      This action is permanent
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-[--color-accent-red]/5 border border-[--color-accent-red]/20">
                    <p className="text-sm text-[--color-label-primary]">
                      Are you sure you want to deactivate your account? This will:
                    </p>
                    <ul className="mt-2 text-xs text-[--color-label-secondary] space-y-1 ml-4 list-disc">
                      <li>Permanently delete your profile and settings</li>
                      <li>Remove you from all teams and organizations</li>
                      <li>Delete all your created widgets and dashboards</li>
                      <li>Revoke all API keys and active sessions</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deactivate-confirm">
                      Type <span className="font-mono font-semibold">DEACTIVATE</span> to confirm
                    </Label>
                    <Input
                      id="deactivate-confirm"
                      value={deactivateConfirmation}
                      onChange={(e) => {
                        setDeactivateConfirmation(e.target.value);
                        setDeactivateError(null);
                      }}
                      placeholder="DEACTIVATE"
                      variant={deactivateError ? 'error' : 'default'}
                    />
                    {deactivateError && (
                      <p className="text-sm text-[--color-accent-red]">{deactivateError}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      variant="destructive"
                      fullWidth
                      onClick={handleDeactivateAccount}
                      disabled={isDeactivating || deactivateConfirmation !== 'DEACTIVATE'}
                    >
                      {isDeactivating ? (
                        <>
                          <Spinner size="sm" />
                          <span className="ml-2">Deactivating...</span>
                        </>
                      ) : (
                        'Deactivate Account'
                      )}
                    </Button>
                    <Button
                      variant="gray"
                      fullWidth
                      onClick={() => {
                        setShowDeactivateDialog(false);
                        setDeactivateConfirmation('');
                        setDeactivateError(null);
                      }}
                      disabled={isDeactivating}
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
    </div>
  );
}
