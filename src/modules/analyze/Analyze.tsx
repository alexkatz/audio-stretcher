import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { usePlayer } from '~/audio/usePlayer';
import { PlayButton } from './PlayButton';
import { SourceDisplay } from './SourceDisplay';
import { useInitializeAnalyze } from './useInitializeAnalyze';
import { IoIosArrowRoundBack } from 'react-icons/io';
import useResizeObserver from 'use-resize-observer';
import { Waveform } from './Waveform';
import { playerIsReady } from '~/audio/playerIsReady';

export const Analyze = () => {
  const router = useRouter();

  const status = usePlayer(player => player.status);
  const play = usePlayer(player => player.play);
  const pause = usePlayer(player => player.pause);

  const isPlaying = status === 'playing';

  const { ref: canvasContainerRef, width = 0, height = 0 } = useResizeObserver();

  useInitializeAnalyze();

  const handleOnClickPlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const handleOnClickBack = useCallback(() => {
    router.push('/');
  }, [router]);

  if (!playerIsReady(status)) {
    return <div>almost ready...</div>;
  }

  return (
    <div className='relative flex h-screen flex-col items-center'>
      <button className='absolute top-0 left-1' onClick={handleOnClickBack}>
        <IoIosArrowRoundBack className='text-slate-500 opacity-60' size={40} />
      </button>
      <SourceDisplay />

      <div ref={canvasContainerRef} className='relative h-1/3 w-full'>
        <Waveform width={width} height={height} />
      </div>

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
