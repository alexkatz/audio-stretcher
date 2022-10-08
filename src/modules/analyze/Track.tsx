import { useState, useLayoutEffect } from 'react';
import { c } from '~/utils/classnames';
import { useAnimatePlayback } from './useAnimatePlayback';
import { useTrack } from '../../common/audio/useTrack';
import { useMouseHandlers } from './useMouseHandlers';

type Props = {
  className?: string;
};

export const Track = ({ className }: Props) => {
  const samples = useTrack(track => track.monoChannelData!);
  const initCanvas = useTrack(track => track.initCanvas);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  useLayoutEffect(() => {
    if (canvas) initCanvas(canvas, samples);
  }, [canvas, initCanvas, samples]);

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
