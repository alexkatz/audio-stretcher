import { HTMLMotionProps, motion } from 'framer-motion';
import { forwardRef, Ref } from 'react';
import { c } from '~/utils/classnames';

export const Busy = forwardRef(({ className, ...props }: HTMLMotionProps<'div'>, ref: Ref<HTMLDivElement>) => (
  <motion.div
    {...props}
    className={c('w-12 h-12 bg-slate-700', className)}
    ref={ref}
    animate={{
      scale: [1, 2, 2, 1, 1],
      opacity: [1, 0.5, 0.5, 1, 1],
      rotate: [0, 0, 180, 180, 0],
      borderRadius: ['0%', '0%', '50%', '50%', '0%'],
    }}
    transition={{
      duration: 2,
      ease: 'easeInOut',
      times: [0, 0.2, 0.5, 0.8, 1],
      repeat: Infinity,
      repeatDelay: 0,
    }}
  />
));
