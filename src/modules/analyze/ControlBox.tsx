import clsx from 'clsx';

type Props = {
  className?: string;
  label?: string;
  children?: React.ReactNode;
  displayValue?: string | number;
  disabled?: boolean;
};

export const ControlBox = ({ className, label, children, displayValue, disabled }: Props) => {
  return (
    <div
      className={clsx(
        'flex select-none flex-col items-center gap-2 p-2',
        {
          'pointer-events-none opacity-40': disabled,
        },
        className,
      )}
    >
      {children}
      <div className='flex flex-col items-center gap-0.5'>
        {label && <div className='text-xs'>{label}</div>}
        {displayValue && <div className='text-xs'>{displayValue}</div>}
      </div>
    </div>
  );
};
