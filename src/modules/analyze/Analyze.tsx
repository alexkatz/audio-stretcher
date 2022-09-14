import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';
import { usePlayer } from '~/audio/usePlayer';

export const Analyze = () => {
  const router = useRouter();
  const player = usePlayer((player) => player);

  useEffect(() => {
    if (!player.isReady && !player.isLoadingFile) router.push('/');
  }, [player, router]);

  const handleOnClickPlay = useCallback(() => {
    if (player.isPlaying) player.pause();
    else player.play();
  }, [player]);

  return (
    <div className='flex flex-col'>
      <button onClick={handleOnClickPlay}>{player.isPlaying ? 'pause' : 'play'}</button>
    </div>
  );
};
