import { motion } from 'framer-motion';
import { ComponentPropsWithoutRef, forwardRef, Ref } from 'react';
import clsx from 'clsx';

type Props = ComponentPropsWithoutRef<'button'> & {
  isActive: boolean;
};

export const CycleButton = motion(
  forwardRef(({ isActive, className, ...props }: Props, ref: Ref<HTMLButtonElement>) => (
    <button
      className={clsx(
        'flex items-center justify-center rounded',
        {
          'bg-ivory': isActive,
          'bg-transparent': !isActive,
          'opacity-60': props.disabled,
        },
        className,
      )}
      ref={ref}
      {...props}
    >
      <svg
        stroke={isActive ? 'black' : 'currentColor'}
        strokeWidth='0'
        className='h-4/6 w-4/6'
        viewBox='0 0 24 24'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          fill='none'
          strokeWidth='2'
          d='M20,8 C18.5343681,5.03213345 15.4860999,3 11.9637942,3 C7.01333514,3 3,7.02954545 3,12 M4,16 C5.4656319,18.9678666 8.51390007,21 12.0362058,21 C16.9866649,21 21,16.9704545 21,12 M9,16 L3,16 L3,22 M21,2 L21,8 L15,8'
        />
      </svg>
    </button>
  )),
);
