'use client';

import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Check,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@d2d/ui';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/store/theme.slice';

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ElementType; description: string }[] = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Always use light mode',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Always use dark mode',
  },
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Match your system settings',
  },
];

export default function AppearanceSettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <Card variant="outlined" padding="lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Appearance
        </CardTitle>
        <CardDescription>
          Customize how Data2Decision looks on your device
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div>
          <h3 className="text-sm font-medium text-[--color-label-primary] mb-3">
            Theme
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-[--color-accent-blue] bg-[--color-accent-blue]/5'
                      : 'border-[--color-separator] hover:border-[--color-label-tertiary] bg-[--color-fill-primary]'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[--color-accent-blue] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        isSelected
                          ? 'bg-[--color-accent-blue]/10 text-[--color-accent-blue]'
                          : 'bg-[--color-fill-primary] text-[--color-label-secondary]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isSelected
                          ? 'text-[--color-accent-blue]'
                          : 'text-[--color-label-primary]'
                      }`}
                    >
                      {option.label}
                    </span>
                    <span className="text-xs text-[--color-label-tertiary] mt-1">
                      {option.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current theme preview */}
        <div className="p-4 rounded-xl bg-[--color-fill-primary]">
          <p className="text-sm text-[--color-label-secondary]">
            Currently using{' '}
            <span className="font-medium text-[--color-label-primary]">
              {resolvedTheme === 'dark' ? 'dark' : 'light'} mode
            </span>
            {theme === 'system' && ' (based on system preference)'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
