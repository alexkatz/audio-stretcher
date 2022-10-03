import { useLayoutEffect, useMemo, useState } from 'react';
import { usePlayer } from '~/audio/usePlayer';
import { TrackPainter } from './TrackPainter';

const RES_FACTOR = 2;

type Props = {
  className?: string;
  width: number;
  height: number;
};

export const TrackCanvas = ({ width, height, className }: Props) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const samples = usePlayer(state => state.monoChannelData!);
  const startedPlayingAt = usePlayer(state => state.startedPlayingAt);
  const [canvasWidth, canvasHeight] = useMemo(() => [width * RES_FACTOR, height * RES_FACTOR], [width, height]);
  const canvasStyle = useMemo(() => ({ width, height }), [width, height]);
  const trackPainter = useMemo(() => (!canvas ? undefined : new TrackPainter(canvas, samples)), [canvas, samples]);

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

  return <canvas width={canvasWidth} height={canvasHeight} style={canvasStyle} ref={setCanvas} className={className} />;
};
