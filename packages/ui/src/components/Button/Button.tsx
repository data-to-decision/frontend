'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold transition-all',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ].join(' '),
  {
    variants: {
      variant: {
        filled: [
          'bg-[--color-accent-blue] text-white',
          'hover:bg-[--color-accent-blue]/90',
          'focus-visible:ring-[--color-accent-blue]',
        ].join(' '),
        tinted: [
          'bg-[--color-accent-blue]/10 text-[--color-accent-blue]',
          'hover:bg-[--color-accent-blue]/20',
          'focus-visible:ring-[--color-accent-blue]',
        ].join(' '),
        gray: [
          'bg-[--color-fill-primary] text-[--color-label-primary]',
          'hover:bg-[--color-fill-secondary]',
          'focus-visible:ring-[--color-label-tertiary]',
        ].join(' '),
        plain: [
          'text-[--color-accent-blue]',
          'hover:bg-[--color-fill-primary]',
          'focus-visible:ring-[--color-accent-blue]',
        ].join(' '),
        destructive: [
          'bg-[--color-accent-red] text-white',
          'hover:bg-[--color-accent-red]/90',
          'focus-visible:ring-[--color-accent-red]',
        ].join(' '),
        outline: [
          'border border-[--color-separator] text-[--color-label-primary]',
          'hover:bg-[--color-fill-primary]',
          'focus-visible:ring-[--color-accent-blue]',
        ].join(' '),
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-md',
        md: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-12 px-6 text-base rounded-xl',
        icon: 'h-10 w-10 rounded-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'filled',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
