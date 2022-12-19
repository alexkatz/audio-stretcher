import { forwardRef, Ref } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

export const Input = forwardRef(({ className, ...props }: HTMLMotionProps<'input'>, ref: Ref<HTMLInputElement>) => (
  <motion.input
    ref={ref}
    className={clsx(
      'rounded border border-ivory bg-transparent px-2 py-1 text-ivory placeholder-ivory/60 caret-ivory focus:outline-0',
      className,
    )}
    {...props}
  />
));
