'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Clock,
  User,
  Filter,
  ChevronDown,
  Building2,
  Users,
  Database,
  Key,
  CreditCard,
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
  Avatar,
  AvatarFallback,
  getInitials,
  Spinner,
} from '@d2d/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import {
  setCurrentOrganization,
  setMembers,
  setSettings,
  setAuditLog,
  appendAuditLog,
  setAuditLogHasMore,
} from '@/store/organization.slice';
import {
  initializeMockOrganization,
  getAuditLogEntries,
  formatAuditAction,
  getAuditLogResourceTypes,
  getAuditLogActors,
} from '@/lib/mock-organization';
import { simulateApiCall } from '@/lib/mock-auth';
import { getAuditLogs } from '@/lib/api';
import type { AuditLogEntry } from '@d2d/types';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

function getResourceIcon(resourceType: string): React.ElementType {
  switch (resourceType) {
    case 'organization':
      return Building2;
    case 'member':
    case 'invitation':
      return Users;
    case 'connection':
      return Database;
    case 'api_key':
      return Key;
    case 'billing':
      return CreditCard;
    case 'security':
      return Shield;
    default:
      return FileText;
  }
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

function AuditLogRow({ entry }: { entry: AuditLogEntry }) {
  const Icon = getResourceIcon(entry.resourceType);

  return (
    <div className="flex items-start gap-4 py-4 border-b border-[--color-separator] last:border-b-0">
      <div className="w-8 h-8 rounded-full bg-[--color-fill-primary] flex items-center justify-center text-[--color-label-secondary]">
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[--color-label-primary]">
          {formatAuditAction(entry.action)}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[--color-label-tertiary]">
          <span className="flex items-center gap-1">
            <Avatar size="xs">
              <AvatarFallback className="text-[8px]">
                {getInitials(entry.actorName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[--color-label-secondary]">
              {entry.actorName}
              {entry.actorEmail && (
                <span className="text-[--color-label-tertiary]"> ({entry.actorEmail})</span>
              )}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatFullDate(entry.createdAt)}
          </span>
          {entry.ipAddress && <span>IP: {entry.ipAddress}</span>}
        </div>

        {/* Show metadata if available - only render for actions we have formatting for */}
        {Object.keys(entry.metadata).length > 0 && (
          <>
            {entry.action === 'member.invited' && entry.metadata.email && (
              <div className="mt-2 p-2 rounded-lg bg-[--color-fill-primary] text-xs">
                <span className="text-[--color-label-secondary]">
                  Invited <span className="text-[--color-label-primary]">{String(entry.metadata.email)}</span> as {String(entry.metadata.role)}
                </span>
              </div>
            )}
            {entry.action === 'member.role_changed' && (
              <div className="mt-2 p-2 rounded-lg bg-[--color-fill-primary] text-xs">
                <span className="text-[--color-label-secondary]">
                  Changed role from <span className="text-[--color-label-primary]">{String(entry.metadata.from)}</span> to <span className="text-[--color-label-primary]">{String(entry.metadata.to)}</span>
                </span>
              </div>
            )}
            {entry.action === 'connection.created' && entry.metadata.name && (
              <div className="mt-2 p-2 rounded-lg bg-[--color-fill-primary] text-xs">
                <span className="text-[--color-label-secondary]">
                  Created <span className="text-[--color-label-primary]">{String(entry.metadata.type)}</span> connection: {String(entry.metadata.name)}
                </span>
              </div>
            )}
            {entry.action === 'billing.plan_changed' && (
              <div className="mt-2 p-2 rounded-lg bg-[--color-fill-primary] text-xs">
                <span className="text-[--color-label-secondary]">
                  Changed from <span className="text-[--color-label-primary]">{String(entry.metadata.from)}</span> to <span className="text-[--color-label-primary]">{String(entry.metadata.to)}</span>
                </span>
              </div>
            )}
            {entry.action === 'organization.settings_updated' && entry.metadata.changes && (
              <div className="mt-2 p-2 rounded-lg bg-[--color-fill-primary] text-xs">
                <span className="text-[--color-label-secondary]">
                  Updated: {(entry.metadata.changes as string[]).join(', ')}
                </span>
              </div>
            )}
            {entry.action === 'session.revoked' && entry.metadata.reason && (
              <div className="mt-2 p-2 rounded-lg bg-[--color-fill-primary] text-xs">
                <span className="text-[--color-label-secondary]">
                  Reason: <span className="text-[--color-label-primary]">{String(entry.metadata.reason)}</span>
                  {entry.metadata.browser && (
                    <> on {String(entry.metadata.browser)}</>
                  )}
                  {entry.metadata.os && (
                    <> ({String(entry.metadata.os)})</>
                  )}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="shrink-0 text-xs text-[--color-label-tertiary]">
        {formatDate(entry.createdAt)}
      </div>
    </div>
  );
}

export default function OrganizationAuditLogPage() {
  const dispatch = useAppDispatch();
  const { currentOrganization, auditLog, auditLogHasMore, isLoading } = useAppSelector(
    (state) => state.organization
  );
  const [filterResourceType, setFilterResourceType] = useState('all');
  const [filterActor, setFilterActor] = useState('all');
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actors, setActors] = useState<Array<{ id: string; name: string }>>([]);
  const PAGE_SIZE = 10;

  // Derive resource types from actual entries when in API mode
  // In mock mode, use the static hardcoded categories
  const resourceTypes = useMemo(() => {
    if (USE_MOCK_AUTH) {
      return getAuditLogResourceTypes();
    }
    // Derive unique resource types from actual entries in API mode
    const types = new Set(auditLog.map((e) => e.resourceType));
    return ['all', ...Array.from(types).sort()];
  }, [auditLog]);

  // Derive actors from actual entries when in API mode
  const derivedActors = useMemo(() => {
    if (USE_MOCK_AUTH) {
      return actors;
    }
    // Derive unique actors from actual entries in API mode
    const actorsMap = new Map<string, { name: string; email: string | null }>();
    auditLog.forEach((entry) => {
      if (entry.actorId && !actorsMap.has(entry.actorId)) {
        actorsMap.set(entry.actorId, { name: entry.actorName, email: entry.actorEmail });
      }
    });
    return Array.from(actorsMap.entries()).map(([id, { name, email }]) => ({
      id,
      name: email ? `${name} (${email})` : name,
    }));
  }, [auditLog, actors]);

  // Load entries using mock or API based on feature flag
  const loadEntries = async (
    pageNum: number,
    filters?: { resourceType?: string; actorId?: string },
    append: boolean = false
  ) => {
    setError(null);

    if (USE_MOCK_AUTH) {
      // Mock mode - use local mock data
      const result = getAuditLogEntries(pageNum, PAGE_SIZE, {
        resourceType: filters?.resourceType,
        actorId: filters?.actorId,
      });
      if (append) {
        dispatch(appendAuditLog(result.entries));
      } else {
        dispatch(setAuditLog(result.entries));
      }
      dispatch(setAuditLogHasMore(result.hasMore));
    } else {
      // API mode - fetch from real backend
      if (!currentOrganization?.id) {
        setError('No organization selected');
        return;
      }

      try {
        const offset = (pageNum - 1) * PAGE_SIZE;
        const result = await getAuditLogs(currentOrganization.id, PAGE_SIZE, offset, {
          resourceType: filters?.resourceType,
          actorId: filters?.actorId,
        });

        if (append) {
          dispatch(appendAuditLog(result.entries));
        } else {
          dispatch(setAuditLog(result.entries));
        }
        dispatch(setAuditLogHasMore(result.hasMore));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load audit log';
        setError(errorMessage);
        console.error('Failed to load audit log:', err);
      }
    }
  };

  useEffect(() => {
    const initializeAuditLog = async () => {
      setIsInitialLoading(true);

      if (USE_MOCK_AUTH) {
        const orgData = initializeMockOrganization();
        if (orgData.organizations.length > 0) {
          dispatch(setCurrentOrganization(orgData.organizations[0]));
          dispatch(setMembers(orgData.members));
          dispatch(setSettings(orgData.settings));
          setActors(getAuditLogActors());
        }
      }

      await loadEntries(1, {
        resourceType: filterResourceType,
        actorId: filterActor !== 'all' ? filterActor : undefined,
      });

      setIsInitialLoading(false);
    };

    // For API mode, wait until we have an organization
    if (USE_MOCK_AUTH || currentOrganization?.id) {
      initializeAuditLog();
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    // Skip if we're still in initial loading
    if (isInitialLoading) return;

    setPage(1);
    loadEntries(1, {
      resourceType: filterResourceType,
      actorId: filterActor !== 'all' ? filterActor : undefined,
    });
  }, [filterResourceType, filterActor]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    if (USE_MOCK_AUTH) {
      await simulateApiCall(null, 500);
    }
    const nextPage = page + 1;
    await loadEntries(
      nextPage,
      {
        resourceType: filterResourceType,
        actorId: filterActor !== 'all' ? filterActor : undefined,
      },
      true
    );
    setPage(nextPage);
    setIsLoadingMore(false);
  };

  const formatResourceTypeLabel = (type: string): string => {
    if (type === 'all') return 'All Resources';
    if (type === 'api_key') return 'API Keys';
    return type.charAt(0).toUpperCase() + type.slice(1);
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
                Failed to load audit log
              </p>
              <p className="text-xs text-[--color-label-tertiary] mt-1">{error}</p>
              <Button
                variant="gray"
                className="mt-4"
                onClick={() => {
                  setPage(1);
                  loadEntries(1, {
                    resourceType: filterResourceType,
                    actorId: filterActor !== 'all' ? filterActor : undefined,
                  });
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
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Audit Log
              </CardTitle>
              <CardDescription>
                View all organization activity and changes
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Select value={filterResourceType} onValueChange={setFilterResourceType}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatResourceTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterActor} onValueChange={setFilterActor}>
                <SelectTrigger className="w-[160px]">
                  <User className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {derivedActors.map((actor) => (
                    <SelectItem key={actor.id} value={actor.id}>
                      {actor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {auditLog.length === 0 ? (
            <div className="text-center p-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[--color-fill-primary] flex items-center justify-center">
                <FileText className="w-6 h-6 text-[--color-label-tertiary]" />
              </div>
              <p className="text-sm font-medium text-[--color-label-primary]">
                No audit entries found
              </p>
              <p className="text-xs text-[--color-label-tertiary] mt-1">
                {filterResourceType !== 'all' || filterActor !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Organization activity will appear here'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-[--color-separator]">
                {auditLog.map((entry) => (
                  <AuditLogRow key={entry.id} entry={entry} />
                ))}
              </div>

              {auditLogHasMore && (
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
