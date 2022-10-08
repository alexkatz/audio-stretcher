import { useLayoutEffect } from 'react';
import { useTrack } from '../../common/audio/useTrack';

export const useAnimatePlayback = () => {
  const startedPlayingAt = useTrack(track => track.startedPlayingAt);
  const draw = useTrack(track => track.draw);

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
};
