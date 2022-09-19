import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { c } from '~/utils/classnames';
import { GrPlayFill, GrPauseFill } from 'react-icons/gr';
import { motion } from 'framer-motion';

type Props = ComponentPropsWithoutRef<'button'> & {
  isPlaying: boolean;
};

const SIZE = 44;

export const PlayButton = motion(
  forwardRef<HTMLButtonElement, Props>(({ className, isPlaying, ...props }, ref) => {
    return (
      <button className={c('flex justify-center items-center', className)} ref={ref} {...props}>
        {isPlaying ? <GrPauseFill size={SIZE} /> : <GrPlayFill size={SIZE} />}
      </button>
    );
  }),
);
