'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Clock,
  Globe,
  Filter,
  ChevronDown,
  LogIn,
  LogOut,
  User,
  Users,
  Database,
  Key,
  Layout,
  Share2,
  Shield,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Spinner,
} from '@d2d/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { setEntries, appendEntries, setHasMore } from '@/store/activity.slice';
import {
  initializeMockActivity,
  getActivityEntries,
  formatActivityAction,
  getActivityActionCategories,
} from '@/lib/mock-activity';
import { simulateApiCall } from '@/lib/mock-auth';
import { getActivityLog } from '@/lib/api';
import type { ActivityLogEntry } from '@d2d/types';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

function getActionIcon(action: string): React.ElementType {
  if (action.startsWith('user.login')) return LogIn;
  if (action.startsWith('user.logout')) return LogOut;
  if (action.startsWith('user.')) return User;
  if (action.startsWith('team.')) return Users;
  if (action.startsWith('connection.')) return Database;
  if (action.startsWith('api_key.')) return Key;
  if (action.startsWith('widget.')) return Layout;
  if (action.startsWith('dashboard.')) return Share2;
  return Activity;
}

function getActionColor(action: string): string {
  if (action.includes('login') || action.includes('created') || action.includes('enabled')) {
    return 'text-[--color-accent-green]';
  }
  if (action.includes('logout') || action.includes('deleted') || action.includes('removed') || action.includes('disabled') || action.includes('revoked')) {
    return 'text-[--color-accent-red]';
  }
  if (action.includes('updated') || action.includes('changed')) {
    return 'text-[--color-accent-blue]';
  }
  return 'text-[--color-label-secondary]';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function parseBrowser(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown Browser';
}

function formatMetadataDisplay(action: string, metadata: Record<string, unknown>): React.ReactNode | null {
  // user.login with method
  if (action === 'user.login' && metadata.method) {
    return (
      <span className="text-[--color-label-secondary]">
        Method: <span className="text-[--color-label-primary]">{String(metadata.method)}</span>
      </span>
    );
  }

  // user.profile_updated with fields array
  if (action === 'user.profile_updated' && Array.isArray(metadata.fields) && metadata.fields.length > 0) {
    return (
      <span className="text-[--color-label-secondary]">
        Updated: <span className="text-[--color-label-primary]">{metadata.fields.join(', ')}</span>
      </span>
    );
  }

  // org.updated - show what was updated
  if (action === 'org.updated') {
    const keys = Object.keys(metadata);
    if (keys.length > 0) {
      return (
        <span className="text-[--color-label-secondary]">
          Updated: <span className="text-[--color-label-primary]">{keys.join(', ')}</span>
        </span>
      );
    }
  }

  // org.member_invited with email and role
  if (action === 'org.member_invited' && metadata.email) {
    return (
      <span className="text-[--color-label-secondary]">
        Invited <span className="text-[--color-label-primary]">{String(metadata.email)}</span> as {String(metadata.role || 'member')}
      </span>
    );
  }

  // org.member_role_changed with from and to
  if (action === 'org.member_role_changed' && metadata.from && metadata.to) {
    return (
      <span className="text-[--color-label-secondary]">
        Changed role from <span className="text-[--color-label-primary]">{String(metadata.from)}</span> to <span className="text-[--color-label-primary]">{String(metadata.to)}</span>
      </span>
    );
  }

  // invitation.accepted with type, role, method
  if (action === 'invitation.accepted') {
    const parts: string[] = [];
    if (metadata.type) parts.push(`${String(metadata.type)} invitation`);
    if (metadata.role) parts.push(`as ${String(metadata.role)}`);
    if (metadata.method) parts.push(`via ${String(metadata.method)}`);
    if (parts.length > 0) {
      return (
        <span className="text-[--color-label-secondary]">
          Accepted <span className="text-[--color-label-primary]">{parts.join(' ')}</span>
        </span>
      );
    }
  }

  // Legacy team.member_invited (keep backward compatibility)
  if (action === 'team.member_invited' && metadata.email) {
    return (
      <span className="text-[--color-label-secondary]">
        Invited <span className="text-[--color-label-primary]">{String(metadata.email)}</span> as {String(metadata.role || 'member')}
      </span>
    );
  }

  // Legacy team.role_changed (keep backward compatibility)
  if (action === 'team.role_changed' && metadata.from && metadata.to) {
    return (
      <span className="text-[--color-label-secondary]">
        Changed role from <span className="text-[--color-label-primary]">{String(metadata.from)}</span> to <span className="text-[--color-label-primary]">{String(metadata.to)}</span>
      </span>
    );
  }

  // connection.created with name and type
  if (action === 'connection.created' && metadata.name) {
    return (
      <span className="text-[--color-label-secondary]">
        Created <span className="text-[--color-label-primary]">{String(metadata.type)}</span> connection: {String(metadata.name)}
      </span>
    );
  }

  // Fallback: if metadata exists but no specific handler matched, return null to hide the box
  // Alternatively, could show a generic display of the metadata keys/values
  return null;
}

function ActivityRow({ entry }: { entry: ActivityLogEntry }) {
  const Icon = getActionIcon(entry.action);
  const colorClass = getActionColor(entry.action);
  const browser = parseBrowser(entry.userAgent);

  const hasMetadata = Object.keys(entry.metadata).length > 0;
  const metadataDisplay = hasMetadata ? formatMetadataDisplay(entry.action, entry.metadata) : null;

  return (
    <div className="flex items-start gap-4 py-4 border-b border-[--color-separator] last:border-b-0">
      <div className={`w-8 h-8 rounded-full bg-[--color-fill-primary] flex items-center justify-center ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[--color-label-primary]">
          {formatActivityAction(entry.action)}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[--color-label-tertiary]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatFullDate(entry.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {browser} - {entry.ipAddress}
          </span>
        </div>

        {/* Show metadata if available and has a display handler */}
        {metadataDisplay && (
          <div className="mt-2 p-2 rounded-lg bg-[--color-fill-primary] text-xs">
            {metadataDisplay}
          </div>
        )}
      </div>

      <div className="shrink-0 text-xs text-[--color-label-tertiary]">
        {formatDate(entry.createdAt)}
      </div>
    </div>
  );
}

export default function ActivitySettingsPage() {
  const dispatch = useAppDispatch();
  const { entries, hasMore, isLoading } = useAppSelector((state) => state.activity);
  const [filterAction, setFilterAction] = useState('all');
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  // Derive filter categories from actual entries when in API mode
  // In mock mode, use the static hardcoded categories
  const actionCategories = useMemo(() => {
    if (USE_MOCK_AUTH) {
      return getActivityActionCategories();
    }
    // Derive categories from actual entries in API mode
    // Extract unique prefixes from action strings (e.g., 'user' from 'user.login')
    const prefixes = new Set(entries.map((e) => e.action.split('.')[0]));
    return ['all', ...Array.from(prefixes).sort()];
  }, [entries]);

  // Filter entries client-side (for both mock and API modes)
  const filterEntriesByAction = (
    allEntries: ActivityLogEntry[],
    filter: string
  ): ActivityLogEntry[] => {
    if (filter === 'all') return allEntries;
    return allEntries.filter((e) => e.action.startsWith(filter));
  };

  // Load entries using mock or API based on feature flag
  const loadEntries = async (pageNum: number, filter: string, append: boolean = false) => {
    setError(null);

    if (USE_MOCK_AUTH) {
      // Mock mode - use local mock data
      const result = getActivityEntries(pageNum, PAGE_SIZE, filter);
      if (append) {
        dispatch(appendEntries(result.entries));
      } else {
        dispatch(setEntries(result.entries));
      }
      dispatch(setHasMore(result.hasMore));
    } else {
      // API mode - fetch from real backend
      try {
        // Calculate offset from page number
        const offset = (pageNum - 1) * PAGE_SIZE;
        const result = await getActivityLog(PAGE_SIZE, offset);

        // Filter entries client-side
        const filteredEntries = filterEntriesByAction(result.entries, filter);

        if (append) {
          dispatch(appendEntries(filteredEntries));
        } else {
          dispatch(setEntries(filteredEntries));
        }
        dispatch(setHasMore(result.hasMore));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load activity log';
        setError(errorMessage);
        console.error('Failed to load activity log:', err);
      }
    }
  };

  useEffect(() => {
    const initializeActivity = async () => {
      setIsInitialLoading(true);
      if (USE_MOCK_AUTH) {
        initializeMockActivity();
      }
      await loadEntries(1, filterAction);
      setIsInitialLoading(false);
    };
    initializeActivity();
  }, []);

  useEffect(() => {
    setPage(1);
    loadEntries(1, filterAction);
  }, [filterAction]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    if (USE_MOCK_AUTH) {
      await simulateApiCall(null, 500);
    }
    const nextPage = page + 1;
    await loadEntries(nextPage, filterAction, true);
    setPage(nextPage);
    setIsLoadingMore(false);
  };

  const formatCategoryLabel = (category: string): string => {
    if (category === 'all') return 'All Activities';
    if (category === 'api_key') return 'API Keys';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (isLoading || isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card variant="outlined" padding="lg">
          <CardContent>
            <div className="text-center p-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[--color-fill-primary] flex items-center justify-center">
                <Shield className="w-6 h-6 text-[--color-accent-red]" />
              </div>
              <p className="text-sm font-medium text-[--color-label-primary]">
                Failed to load activity
              </p>
              <p className="text-xs text-[--color-label-tertiary] mt-1">
                {error}
              </p>
              <Button
                variant="gray"
                className="mt-4"
                onClick={() => {
                  setPage(1);
                  loadEntries(1, filterAction);
                }}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="outlined" padding="lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activity Log
              </CardTitle>
              <CardDescription>
                View your recent account activity
              </CardDescription>
            </div>

            {/* Filter */}
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {actionCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {formatCategoryLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center p-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[--color-fill-primary] flex items-center justify-center">
                <Activity className="w-6 h-6 text-[--color-label-tertiary]" />
              </div>
              <p className="text-sm font-medium text-[--color-label-primary]">
                No activity found
              </p>
              <p className="text-xs text-[--color-label-tertiary] mt-1">
                {filterAction !== 'all'
                  ? 'Try a different filter'
                  : 'Your activity will appear here'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-[--color-separator]">
                {entries.map((entry) => (
                  <ActivityRow key={entry.id} entry={entry} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    variant="gray"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Spinner size="sm" />
                        <span className="ml-2">Loading...</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span className="ml-1">Load More</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
