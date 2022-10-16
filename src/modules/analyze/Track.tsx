import { useState, useLayoutEffect } from 'react';
import { c } from '~/utils/classnames';
import { useTrack } from '../../common/audio/useTrack';
import { useAnimatePlayback } from './useAnimatePlayback';
import { useCanvasEventHandlers } from './useCanvasEventHandlers';

type Props = {
  className?: string;
};

export const Track = ({ className }: Props) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  useLayoutEffect(() => {
    const { initCanvas, status } = useTrack.getState();
    if (canvas && status === 'initialized') initCanvas(canvas);
  }, [canvas]);

  useAnimatePlayback();

  const handlers = useCanvasEventHandlers(canvas);

  return (
    <div className={c('relative cursor-text', className)}>
      <canvas className='h-full w-full' ref={setCanvas} {...handlers} />
    </div>
  );
};
