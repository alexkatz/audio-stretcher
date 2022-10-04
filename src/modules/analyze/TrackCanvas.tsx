import { useCallback, useLayoutEffect, useMemo, useState, MouseEvent, useRef } from 'react';
import { usePlayer } from '~/audio/usePlayer';
import { TrackPainter } from './TrackPainter';

const RES_FACTOR = 2;
const MIN_LOOP_PERCENT = 0.005;

const isLoop = (start: number, end: number) => end - start > MIN_LOOP_PERCENT;

type Props = {
  className?: string;
  width: number;
  height: number;
};

export const TrackCanvas = ({ width, height, className }: Props) => {
  const samples = usePlayer(state => state.monoChannelData!);
  const startedPlayingAt = usePlayer(state => state.startedPlayingAt);
  const updateLocators = usePlayer(state => state.updateLocators);

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  const [canvasWidth, canvasHeight] = useMemo(() => [width * RES_FACTOR, height * RES_FACTOR], [width, height]);
  const canvasStyle = useMemo(() => ({ width, height }), [width, height]);
  const trackPainter = useMemo(() => (!canvas ? undefined : new TrackPainter(canvas, samples)), [canvas, samples]);

  const isMouseDownRef = useRef(false);
  const mouseDownPercentRef = useRef<number | undefined>();

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

      trackPainter?.paint();
    },
    [trackPainter, updateLocators, width],
  );

  const handleOnMouseDown = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const percent = e.clientX / width;
      updateLocators('loop', { startPercent: percent });
      mouseDownPercentRef.current = percent;
      isMouseDownRef.current = true;
      trackPainter?.paint();
    },
    [trackPainter, updateLocators, width],
  );

  const handleOnMouseUp = useCallback(() => {
    isMouseDownRef.current = false;
    mouseDownPercentRef.current = undefined;
  }, []);

  const handleOnMouseLeave = useCallback(() => {
    updateLocators('hover', undefined);
    trackPainter?.paint();
  }, [trackPainter, updateLocators]);

  useLayoutEffect(() => {
    let shouldUpdate = true;

    const update = () => {
      if (!shouldUpdate) return;
      trackPainter?.paint();
      requestAnimationFrame(update);
    };

    if (startedPlayingAt != null) {
      requestAnimationFrame(update);
    } else {
      trackPainter?.paint();
    }
    return () => {
      shouldUpdate = false;
    };
  }, [trackPainter, startedPlayingAt]);

  return (
    <canvas
      width={canvasWidth}
      height={canvasHeight}
      style={canvasStyle}
      ref={setCanvas}
      className={className}
      onMouseMove={handleOnMouseMove}
      onMouseLeave={handleOnMouseLeave}
      onMouseDown={handleOnMouseDown}
      onMouseUp={handleOnMouseUp}
    />
  );
};
