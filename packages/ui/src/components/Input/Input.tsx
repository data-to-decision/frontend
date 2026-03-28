'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const inputVariants = cva(
  [
    'flex w-full',
    'border bg-[--color-fill-primary] text-[--color-label-primary]',
    'transition-all duration-200',
    'placeholder:text-[--color-label-tertiary]',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-xs rounded-md',
        md: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-12 px-4 text-base rounded-xl',
      },
      variant: {
        default: [
          'border-[--color-separator]',
          'focus:border-[--color-accent-blue] focus:ring-[--color-accent-blue]/20',
        ].join(' '),
        error: [
          'border-[--color-accent-red]',
          'focus:border-[--color-accent-red] focus:ring-[--color-accent-red]/20',
        ].join(' '),
        success: [
          'border-[--color-accent-green]',
          'focus:border-[--color-accent-green] focus:ring-[--color-accent-green]/20',
        ].join(' '),
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, variant, type, leftIcon, rightIcon, ...props }, ref) => {
    if (leftIcon || rightIcon) {
      return (
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-label-tertiary]">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ size, variant }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-label-tertiary]">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(inputVariants({ size, variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
