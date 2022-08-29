import { ComponentPropsWithoutRef, forwardRef, Ref } from 'react';
import { twMerge } from 'tailwind-merge';

export const Input = forwardRef(
  ({ className, ...props }: ComponentPropsWithoutRef<'input'>, ref: Ref<HTMLInputElement>) => (
    <input
      ref={ref}
      className={twMerge(
        'bg-transparent placeholder-slate-500 border border-slate-400 rounded px-2 py-1 focus:outline-0',
        className,
      )}
      {...props}
    />
  ),
);
