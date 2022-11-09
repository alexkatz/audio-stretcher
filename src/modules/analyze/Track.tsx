import { useState, useLayoutEffect } from 'react';
import { useKeydown } from '~/hooks/useKeyboard';
import { c } from '~/utils/classnames';
import { useTrack } from '../../common/audio/useTrack';
import { TrackBottomArea } from './TrackBottomArea';
import { useAnimatePlayback } from './useAnimatePlayback';
import { useCanvasEventHandlers } from './useCanvasEventHandlers';

type Props = {
  className?: string;
};

export const Track = ({ className }: Props) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  useKeydown(({ code, shiftKey }) => {
    const { loopLocators, zoom, updateLocators, zoomLocators } = useTrack.getState();

    if (!shiftKey && code === 'KeyZ') {
      if (!loopLocators || loopLocators.start === 0 || loopLocators.start === 1) return;
      zoom(loopLocators).draw();
    } else if (shiftKey && code === 'KeyZ') {
      zoom({ reset: true })
        .updateLocators('loop', loopLocators => (loopLocators == null ? zoomLocators : loopLocators))
        .draw();
    } else if (code === 'Escape') {
      updateLocators('loop', undefined).draw();
    }
  }, []);

  useLayoutEffect(() => {
    const { initCanvas, status } = useTrack.getState();
    if (canvas && status === 'initialized') initCanvas(canvas);
  }, [canvas]);

  useAnimatePlayback();

  const canvasHandlers = useCanvasEventHandlers(canvas);

  return (
    <div className={c('relative cursor-text', className)}>
      <canvas className='h-full w-full' ref={setCanvas} {...canvasHandlers} />
      <TrackBottomArea className='absolute bottom-0 left-0 right-0 select-none' />
    </div>
  );
};
