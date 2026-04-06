'use client';

import { useState, useEffect } from 'react';
import {
  UserPlus,
  Clock,
  Check,
  X,
  Users,
  Mail,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Avatar,
  AvatarFallback,
  getInitials,
  Spinner,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@d2d/ui';
import { useAppSelector } from '@/hooks/useStore';
import { listJoinRequests, approveJoinRequest, rejectJoinRequest } from '@/lib/api';
import type { TeamJoinRequest, OrganizationRole } from '@d2d/types';

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

interface JoinRequestRowProps {
  request: TeamJoinRequest;
  onApprove: (requestId: string, role: OrganizationRole) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
  isProcessing: boolean;
}

function JoinRequestRow({ request, onApprove, onReject, isProcessing }: JoinRequestRowProps) {
  const [selectedRole, setSelectedRole] = useState<OrganizationRole>('member');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(request.id, selectedRole);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject(request.id);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-[--color-separator] last:border-b-0">
      <Avatar size="md">
        {request.avatarUrl ? (
          <img src={request.avatarUrl} alt={request.name} />
        ) : (
          <AvatarFallback>{getInitials(request.name || request.email)}</AvatarFallback>
        )}
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[--color-label-primary]">
          {request.name || 'New User'}
        </p>
        <div className="flex items-center gap-2 text-xs text-[--color-label-tertiary]">
          <Mail className="w-3 h-3" />
          <span>{request.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[--color-label-tertiary] mt-1">
          <Clock className="w-3 h-3" />
          <span>Requested {formatDate(request.requestedAt)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={selectedRole}
          onValueChange={(value) => setSelectedRole(value as OrganizationRole)}
          disabled={isProcessing}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="filled"
          size="sm"
          onClick={handleApprove}
          disabled={isProcessing || isApproving}
        >
          {isApproving ? <Spinner size="sm" /> : <Check className="w-4 h-4" />}
          Approve
        </Button>

        <Button
          variant="gray"
          size="sm"
          onClick={handleReject}
          disabled={isProcessing || isRejecting}
        >
          {isRejecting ? <Spinner size="sm" /> : <X className="w-4 h-4" />}
          Reject
        </Button>
      </div>
    </div>
  );
}

export default function JoinRequestsPage() {
  const { currentOrganization } = useAppSelector((state) => state.organization);
  const [joinRequests, setJoinRequests] = useState<TeamJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadJoinRequests = async () => {
    if (!currentOrganization?.id) {
      setError('No organization selected');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const result = await listJoinRequests(currentOrganization.id);
      setJoinRequests(result.joinRequests);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load join requests';
      setError(errorMessage);
      console.error('Failed to load join requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrganization?.id) {
      loadJoinRequests();
    }
  }, [currentOrganization?.id]);

  const handleApprove = async (requestId: string, role: OrganizationRole) => {
    if (!currentOrganization?.id) return;

    setProcessingId(requestId);
    try {
      await approveJoinRequest(currentOrganization.id, requestId, role);
      // Remove from list after approval
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error('Failed to approve join request:', err);
      setError('Failed to approve request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!currentOrganization?.id) return;

    setProcessingId(requestId);
    try {
      await rejectJoinRequest(currentOrganization.id, requestId);
      // Remove from list after rejection
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error('Failed to reject join request:', err);
      setError('Failed to reject request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="outlined" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Join Requests
          </CardTitle>
          <CardDescription>
            Review and manage requests from users who want to join your organization
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[--color-accent-red]/10 text-[--color-accent-red] text-sm">
              {error}
            </div>
          )}

          {joinRequests.length === 0 ? (
            <div className="text-center p-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[--color-fill-primary] flex items-center justify-center">
                <Users className="w-6 h-6 text-[--color-label-tertiary]" />
              </div>
              <p className="text-sm font-medium text-[--color-label-primary]">
                No pending requests
              </p>
              <p className="text-xs text-[--color-label-tertiary] mt-1">
                When users from your domain request to join, they&apos;ll appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[--color-separator]">
              {joinRequests.map((request) => (
                <JoinRequestRow
                  key={request.id}
                  request={request}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isProcessing={processingId === request.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
