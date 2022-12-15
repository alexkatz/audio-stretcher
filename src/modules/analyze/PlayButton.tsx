import { ComponentPropsWithoutRef, forwardRef, Ref } from 'react';
import { c } from '~/utils/classnames';
import { IoIosPlay, IoIosPause } from 'react-icons/io';
import { motion } from 'framer-motion';

type Props = ComponentPropsWithoutRef<'button'> & {
  isPlaying: boolean;
};

export const PlayButton = motion(
  forwardRef(({ className, isPlaying, ...props }: Props, ref: Ref<HTMLButtonElement>) => (
    <button className={c('flex items-center justify-center text-primary', className)} ref={ref} {...props}>
      {isPlaying ? <IoIosPause className='h-5/6 w-5/6' /> : <IoIosPlay className='h-5/6 w-5/6' />}
    </button>
  )),
);
