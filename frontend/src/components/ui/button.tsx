import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-neutral-900 text-white shadow-xs hover:bg-neutral-800 active:bg-black dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200',
        primary:
          'bg-neutral-900 text-white shadow-xs hover:bg-neutral-800 active:bg-black dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200',
        destructive:
          'bg-rose-600 text-white shadow-xs hover:bg-rose-500 dark:bg-rose-700',
        success:
          'bg-emerald-600 text-white shadow-xs hover:bg-emerald-500 active:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500',
        outline:
          'border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 text-neutral-800 dark:text-neutral-200',
        secondary:
          'bg-neutral-100 text-neutral-900 shadow-xs hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700',
        ghost:
          'hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 text-neutral-700 dark:text-neutral-300',
        link: 'text-neutral-900 dark:text-neutral-100 underline-offset-4 hover:underline font-semibold',
      },
      size: {
        default: 'h-8 px-3 text-xs',
        sm: 'h-7 rounded-md px-2.5 text-[11px]',
        lg: 'h-9 rounded-md px-4 text-xs font-medium',
        icon: 'h-8 w-8 rounded-md p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
