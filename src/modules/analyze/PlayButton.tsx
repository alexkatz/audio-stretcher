import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { c } from '~/utils/classnames';
import { IoIosPlay, IoIosPause } from 'react-icons/io';
import { motion } from 'framer-motion';

type Props = ComponentPropsWithoutRef<'button'> & {
  isPlaying: boolean;
};

const SIZE = 44;

export const PlayButton = motion(
  forwardRef<HTMLButtonElement, Props>(({ className, isPlaying, ...props }, ref) => {
    return (
      <button className={c('flex items-center justify-center', className)} ref={ref} {...props}>
        {isPlaying ? <IoIosPause size={SIZE} /> : <IoIosPlay size={SIZE} />}
      </button>
    );
  }),
);
