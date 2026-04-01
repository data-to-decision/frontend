'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-[10px]',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-14 w-14 text-lg',
        xl: 'h-20 w-20 text-2xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size, className }))}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full',
      'bg-[--color-accent-blue]',
      'font-semibold text-white',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// Helper to get initials from name
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export { Avatar, AvatarImage, AvatarFallback };
