import clsx from 'clsx';
import { ReactNode } from 'react';

type Props = {
  className?: string;
  label?: string;
  children?: ReactNode;
  labelClassName?: string;
};

export const TrackNumeric = ({ className, label, children, labelClassName }: Props) => {
  return (
    <div className={clsx('flex flex-col', className)}>
      <span>{children}</span>
      <span className={clsx('text-xs font-normal text-ivory/40', labelClassName)}>{label}</span>
    </div>
  );
};
