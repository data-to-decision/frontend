/**
 * Audit Log API functions
 */

import type { AuditLogEntry } from '@d2d/types';
import { authApi } from './authenticated-client';

interface AuditLogApiResponse {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_type: string;
  actor_ip: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
}

interface AuditLogListApiResponse {
  entries: AuditLogApiResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditLogListResult {
  entries: AuditLogEntry[];
  total: number;
  hasMore: boolean;
}

export interface AuditLogFilters {
  action?: string;
  resourceType?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Derive a display name from email address
 * e.g., "john.doe@company.com" -> "John Doe"
 */
function deriveNameFromEmail(email: string | null): string {
  if (!email) return 'Unknown';

  const localPart = email.split('@')[0];
  if (!localPart) return 'Unknown';

  // Handle common email formats: john.doe, john_doe, johndoe
  const parts = localPart.split(/[._-]/);
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Transform API response to frontend AuditLogEntry format
 */
function transformAuditLogEntry(entry: AuditLogApiResponse): AuditLogEntry {
  return {
    id: entry.id,
    organizationId: '', // Not returned by backend
    actorType: entry.actor_type,
    actorId: entry.actor_id,
    // Use actual name from API, fall back to deriving from email
    actorName: entry.actor_name || deriveNameFromEmail(entry.actor_email),
    actorEmail: entry.actor_email,
    action: entry.action,
    resourceType: entry.resource_type,
    resourceId: entry.resource_id,
    changes: entry.changes,
    metadata: entry.changes || {}, // Use changes as metadata fallback
    ipAddress: entry.actor_ip,
    userAgent: null,
    createdAt: entry.created_at,
  };
}

/**
 * Fetch audit log entries for an organization
 *
 * @param organizationId - The organization ID to fetch audit logs for
 * @param limit - Maximum number of entries to return
 * @param offset - Number of entries to skip for pagination
 * @param filters - Optional filters for action, resource type, actor, and date range
 * @returns Promise with audit log entries, total count, and pagination info
 */
export async function getAuditLogs(
  organizationId: string,
  limit: number = 50,
  offset: number = 0,
  filters?: AuditLogFilters
): Promise<AuditLogListResult> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (filters?.action && filters.action !== 'all') {
    params.set('action', filters.action);
  }
  if (filters?.resourceType && filters.resourceType !== 'all') {
    params.set('resource_type', filters.resourceType);
  }
  if (filters?.actorId) {
    params.set('actor_id', filters.actorId);
  }
  if (filters?.startDate) {
    params.set('start_date', filters.startDate);
  }
  if (filters?.endDate) {
    params.set('end_date', filters.endDate);
  }

  const response = await authApi.get<AuditLogListApiResponse>(
    `/api/organizations/${organizationId}/audit-log?${params.toString()}`
  );

  // Calculate hasMore based on offset, limit, and total
  const hasMore = response.offset + response.entries.length < response.total;

  return {
    entries: response.entries.map(transformAuditLogEntry),
    total: response.total,
    hasMore,
  };
}
