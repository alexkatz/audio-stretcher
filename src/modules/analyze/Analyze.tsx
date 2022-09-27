import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { usePlayer } from '~/audio/usePlayer';
import { PlayButton } from './PlayButton';
import { SourceDisplay } from './SourceDisplay';
import { useInitializeAnalyze } from './useInitializeAnalyze';

export const Analyze = () => {
  const isPlaying = usePlayer((player) => player.isPlaying);
  const status = usePlayer((player) => player.status);
  const play = usePlayer((player) => player.play);
  const pause = usePlayer((player) => player.pause);

  const router = useRouter();

  useInitializeAnalyze();

  const handleOnClickPlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const handleOnClickBack = useCallback(() => {
    router.push('/');
  }, [router]);

  if (status !== 'ready') {
    return <div>almost ready...</div>;
  }

  return (
    <div className='flex flex-col items-center relative h-screen'>
      <button onClick={handleOnClickBack}>Back</button>
      <SourceDisplay />
      <span className='mt-60'>
        <PlayButton
          className='text-slate-500'
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOnClickPlay}
          isPlaying={isPlaying}
        />
      </span>
    </div>
  );
};
