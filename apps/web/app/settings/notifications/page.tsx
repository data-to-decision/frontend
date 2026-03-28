'use client';

import { Bell } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@d2d/ui';

export default function NotificationsSettingsPage() {
  return (
    <Card variant="outlined" padding="lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          Configure how you receive notifications
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-[--color-label-tertiary]">
          Notification settings will be available soon.
        </p>
      </CardContent>
    </Card>
  );
}
