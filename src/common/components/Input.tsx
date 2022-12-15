import { forwardRef, Ref } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { c } from '~/utils/classnames';

export const Input = forwardRef(({ className, ...props }: HTMLMotionProps<'input'>, ref: Ref<HTMLInputElement>) => (
  <motion.input
    ref={ref}
    className={c(
      'rounded border border-primary bg-transparent px-2 py-1 text-primary placeholder-primary/60 caret-primary focus:outline-0',
      className,
    )}
    {...props}
  />
));
