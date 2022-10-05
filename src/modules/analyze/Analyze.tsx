import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { usePlayer } from '~/audio/usePlayer';
import { PlayButton } from './PlayButton';
import { SourceDisplay } from './SourceDisplay';
import { useInitializeAnalyze } from './useInitializeAnalyze';
import { IoIosArrowRoundBack } from 'react-icons/io';
import { playerIsReady } from '~/audio/playerIsReady';
import { Track } from './Track';
import { useKeydown } from './useKeyboard';
import { useTrack } from './useTrack';

export const Analyze = () => {
  const router = useRouter();

  const status = usePlayer(player => player.status);
  const play = usePlayer(player => player.play);
  const pause = usePlayer(player => player.pause);
  const draw = useTrack(track => track.draw);

  const isPlaying = status === 'playing';

  useInitializeAnalyze();

  const handleOnClickPlay = useCallback(() => {
    if (isPlaying) {
      pause();
      draw();
    } else {
      play();
    }
  }, [draw, isPlaying, pause, play]);

  const handleOnClickBack = useCallback(() => {
    router.push('/');
  }, [router]);

  useKeydown(
    ({ key }) => {
      if (key === ' ') handleOnClickPlay();
    },
    [handleOnClickPlay],
  );

  if (!playerIsReady(status)) {
    return null;
  }

  return (
    <div className='relative flex h-screen flex-col items-center'>
      <Track className='relative h-1/2 w-full' />

      <button className='absolute top-0 left-1' onClick={handleOnClickBack}>
        <IoIosArrowRoundBack className='text-slate-500 opacity-60' size={40} />
      </button>

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
