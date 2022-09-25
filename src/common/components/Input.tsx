import { forwardRef, Ref } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { c } from '~/utils/classnames';

export const Input = forwardRef(({ className, ...props }: HTMLMotionProps<'input'>, ref: Ref<HTMLInputElement>) => (
  <motion.input
    ref={ref}
    className={c('bg-transparent placeholder-slate-500 border rounded px-2 py-1 focus:outline-0', className)}
    {...props}
  />
));
