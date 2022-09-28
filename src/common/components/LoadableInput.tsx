import { HTMLMotionProps, motion } from 'framer-motion';
import { forwardRef, Ref } from 'react';
import { c } from '~/utils/classnames';
import { Input } from './Input';

type Props = HTMLMotionProps<'input'> & {
  containerClassName?: string;
  containerProps?: HTMLMotionProps<'div'>;
  progress?: number;
};

export const LoadableInput = forwardRef(
  ({ containerProps, containerClassName, className, progress = 0, ...props }: Props, ref: Ref<HTMLInputElement>) => {
    return (
      <motion.span className={c('relative', containerClassName)} {...containerProps}>
        <motion.div
          className='absolute left-0 top-0 right-0 bottom-0 h-full w-full bg-slate-400 origin-left rounded'
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress, opacity: progress > 0 ? 0.2 : 0 }}
        />
        <Input className={c('relative h-full bg-transparent w-full', className)} ref={ref} {...props} />
      </motion.span>
    );
  },
);
