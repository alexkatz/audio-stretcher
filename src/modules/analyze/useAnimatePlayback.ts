import { useLayoutEffect } from 'react';
import { usePlayer } from '~/audio/usePlayer';
import { useTrack } from './useTrack';

export const useAnimatePlayback = () => {
  const startedPlayingAt = usePlayer(player => player.startedPlayingAt);
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
