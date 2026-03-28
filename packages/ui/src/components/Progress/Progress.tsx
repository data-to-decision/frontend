'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '../../utils/cn';

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  max?: number;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value = 0, max = 100, ...props }, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full',
        'bg-[--color-fill-primary]',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full rounded-full transition-all duration-300 ease-out',
          'bg-[--color-accent-blue]'
        )}
        style={{ width: `${percentage}%` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
