import { HTMLMotionProps, motion } from 'framer-motion';
import { forwardRef, Ref } from 'react';
import clsx from 'clsx';
import { Input } from './Input';

type Props = HTMLMotionProps<'input'> & {
  containerClassName?: string;
  containerProps?: HTMLMotionProps<'div'>;
  progress?: number;
};

export const LoadableInput = forwardRef(
  ({ containerProps, containerClassName, className, progress = 0, ...props }: Props, ref: Ref<HTMLInputElement>) => {
    return (
      <motion.span className={clsx('relative', containerClassName)} {...containerProps}>
        <motion.div
          className='absolute left-0 top-0 right-0 bottom-0 h-full w-full origin-left rounded bg-ivory'
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress, opacity: progress > 0 ? 0.2 : 0 }}
        />
        <Input className={clsx('relative h-full w-full bg-transparent', className)} ref={ref} {...props} />
      </motion.span>
    );
  },
);
