import { useState, useRef, useCallback, useLayoutEffect, MouseEvent } from 'react';
import { usePlayer } from '~/audio/usePlayer';
import { c } from '~/utils/classnames';
import { useTrack } from './useTrack';

const MIN_LOOP_PERCENT = 0.001;

const isLoop = (start: number, end: number) => end - start > MIN_LOOP_PERCENT;
type Props = {
  className?: string;
};

export const Track = ({ className }: Props) => {
  const samples = usePlayer(state => state.monoChannelData!);
  const startedPlayingAt = usePlayer(state => state.startedPlayingAt);
  const updateLocators = usePlayer(state => state.updateLocators);

  const init = useTrack(state => state.init);
  const draw = useTrack(state => state.draw);
  const { width = 300 } = useTrack(state => state.canvasDomSize);

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  useLayoutEffect(() => {
    if (canvas) init(canvas, samples);
    setTimeout(() => draw(), 1000);
  }, [canvas, draw, init, samples]);

  const isMouseDownRef = useRef(false);
  const mouseDownPercentRef = useRef<number | undefined>();
  const didSetLoopOnMouseDownRef = useRef(false);

  const handleOnMouseMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const mouseDownPercent = mouseDownPercentRef.current;
      if (isMouseDownRef.current && mouseDownPercent != null) {
        updateLocators('loop', locators => {
          if (!locators) return undefined;

          const newPercent = e.clientX / width;

          if (mouseDownPercent < newPercent && isLoop(mouseDownPercent, newPercent)) {
            return { startPercent: mouseDownPercent, endPercent: newPercent };
          }

          if (isLoop(newPercent, mouseDownPercent)) {
            return { startPercent: newPercent, endPercent: mouseDownPercent };
          }

          return { startPercent: mouseDownPercent };
        });
      } else {
        updateLocators('hover', { startPercent: e.clientX / width });
      }

      draw();
    },
    [draw, updateLocators, width],
  );

  const handleOnMouseDown = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const percent = e.clientX / width;
      updateLocators('loop', locators => {
        if (!locators) didSetLoopOnMouseDownRef.current = true;
        return { startPercent: percent };
      });

      mouseDownPercentRef.current = percent;
      isMouseDownRef.current = true;
      draw();
    },
    [draw, updateLocators, width],
  );

  const handleOnMouseUp = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const percent = e.clientX / width;
      const mouseDownPercent = mouseDownPercentRef.current;
      if (
        mouseDownPercent != null &&
        !didSetLoopOnMouseDownRef.current &&
        Math.abs(mouseDownPercent - percent) < MIN_LOOP_PERCENT
      ) {
        updateLocators('loop', undefined);
        draw();
      }

      isMouseDownRef.current = false;
      didSetLoopOnMouseDownRef.current = false;
      mouseDownPercentRef.current = undefined;
    },
    [draw, updateLocators, width],
  );

  const handleOnMouseLeave = useCallback(() => {
    updateLocators('hover', undefined);
    draw();
  }, [draw, updateLocators]);

  useLayoutEffect(() => {
    let shouldUpdate = true;

    const update = () => {
      if (!shouldUpdate) return;
      draw();
      requestAnimationFrame(update);
    };

    if (startedPlayingAt != null) {
      requestAnimationFrame(update);
    }
    return () => {
      shouldUpdate = false;
    };
  }, [startedPlayingAt, draw]);

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
