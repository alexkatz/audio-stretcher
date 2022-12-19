import clsx from 'clsx';
import { MouseEvent, useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useMouseMove, useMouseUp } from '~/hooks/useMouse';

type VerticalProp = { vertical: true };
type HorizontalProp = { horizontal: true };

type Props = ((VerticalProp & Never<HorizontalProp>) | (HorizontalProp & Never<VerticalProp>)) & {
  className?: string;
  value?: number;
  onChange?(value: number): void;
};

export const Slider = ({ className, vertical, horizontal, value, onChange }: Props) => {
  const [isMouseCaptured, setIsMouseCaptured] = useState(false);
  const [isMouseMoving, setIsMouseMoving] = useState(false);

  const containerRef = useRef<HTMLSpanElement>(null);

  const getPercentValue = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (containerRef.current == null) return 0;

      if (horizontal) {
        const { clientX } = e;
        const { clientWidth, offsetLeft } = containerRef.current;
        const x = clientX - offsetLeft;
        return Math.min(Math.max(x / clientWidth, 0), 1);
      }

      const { clientY } = e;
      const { clientHeight, offsetTop } = containerRef.current;
      const y = clientHeight - (clientY - offsetTop);
      return Math.min(Math.max(y / clientHeight, 0), 1);
    },
    [horizontal],
  );

  const handleOnMouseDown = useCallback(
    (e: MouseEvent<HTMLSpanElement>) => {
      onChange?.(getPercentValue(e));
      setIsMouseCaptured(true);
    },
    [getPercentValue, onChange],
  );

  useMouseMove(
    e => {
      if (isMouseCaptured) {
        setIsMouseMoving(true);
        onChange?.(getPercentValue(e));
      }
    },
    [getPercentValue, isMouseCaptured, onChange],
  );

  useMouseUp(
    e => {
      if (isMouseCaptured) {
        onChange?.(getPercentValue(e));
        setIsMouseCaptured(false);
        setIsMouseMoving(false);
      }
    },
    [getPercentValue, isMouseCaptured, onChange],
  );

  return (
    <span
      className={clsx(
        'relative flex cursor-pointer items-center [&>*]:pointer-events-none',
        {
          'h-4': horizontal,
          'w-4 flex-col-reverse': vertical,
        },
        className,
      )}
      ref={containerRef}
      onMouseDown={handleOnMouseDown}
    >
      <div
        className={clsx('rounded-sm bg-ivory/20', {
          'h-1 w-full': horizontal,
          'h-full w-1': vertical,
        })}
      />
      <motion.div
        className={clsx('absolute flex items-center rounded-sm bg-ivory', {
          'h-1': horizontal,
          'w-1 flex-col-reverse': vertical,
        })}
        transition={!isMouseMoving ? undefined : { duration: 0 }}
        animate={{
          [horizontal ? 'width' : 'height']: `${(value ?? 0) * 100}%`,
        }}
      >
        <motion.div
          className={clsx('pointer-events-none absolute h-4 w-4 rounded-lg bg-ivory', {
            '-right-2': horizontal,
            '-top-2': vertical,
          })}
          whileTap={{ scale: 1.2 }}
        />
      </motion.div>
    </span>
  );
};
