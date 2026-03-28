'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size = 'md', ...props }, ref) => {
    return (
      <Loader2
        ref={ref}
        className={cn(
          'animate-spin text-[--color-accent-blue]',
          sizeMap[size],
          className
        )}
        {...props}
      />
    );
  }
);
Spinner.displayName = 'Spinner';

export { Spinner };
