import { useState, useLayoutEffect } from 'react';
import { usePlayer } from '~/audio/usePlayer';
import { c } from '~/utils/classnames';
import { useAnimatePlayback } from './useAnimatePlayback';
import { useTrack } from './useTrack';
import { useMouseHandlers } from './useMouseHandlers';

type Props = {
  className?: string;
};

export const Track = ({ className }: Props) => {
  const samples = usePlayer(state => state.monoChannelData!);
  const init = useTrack(state => state.init);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  useLayoutEffect(() => {
    if (canvas) init(canvas, samples);
  }, [canvas, init, samples]);

  useAnimatePlayback();

  const { handleOnMouseDown, handleOnMouseLeave, handleOnMouseMove, handleOnMouseUp } = useMouseHandlers();

  return (
    <div className={c('relative cursor-text', className)}>
      <canvas
        className='h-full w-full'
        ref={setCanvas}
        onMouseMove={handleOnMouseMove}
        onMouseLeave={handleOnMouseLeave}
        onMouseDown={handleOnMouseDown}
        onMouseUp={handleOnMouseUp}
      />
    </div>
  );
};
