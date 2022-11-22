import { c } from '~/utils/classnames';

type Props = {
  className?: string;
  label?: string;
  children?: React.ReactNode;
  displayValue?: string | number;
};

export const ControlBox = ({ className, label, children, displayValue }: Props) => {
  return (
    <div className={c('flex select-none flex-col items-center gap-2 p-2', className)}>
      {children}
      <div className='flex flex-col items-center gap-0.5'>
        {label && <div className='text-xs text-slate-500'>{label}</div>}
        {displayValue && <div className='text-xs text-slate-500'>{displayValue}</div>}
      </div>
    </div>
  );
};
