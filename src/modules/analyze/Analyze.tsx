import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { PlayButton } from './PlayButton';
import { SourceDisplay } from './SourceDisplay';
import { useInitializeAnalyze } from './useInitializeAnalyze';
import { IoIosArrowRoundBack } from 'react-icons/io';
import { Track } from './Track';
import { useKeydown } from './useKeyboard';
import { useTrack } from '../../common/audio/useTrack';

export const Analyze = () => {
  const router = useRouter();
  const status = useTrack(track => track.status);
  const isPlaying = useTrack(track => track.isPlaying);
  const draw = useTrack(track => track.draw);

  useInitializeAnalyze();

  const handleOnClickPlay = useCallback(() => {
    const { play, pause } = useTrack.getState();

    if (isPlaying) {
      pause();
      draw();
    } else {
      play();
    }
  }, [draw, isPlaying]);

  const handleOnClickBack = useCallback(() => {
    router.push('/');
  }, [router]);

  useKeydown(
    ({ key }) => {
      if (key === ' ') {
        handleOnClickPlay();
      } else if (key === 'z') {
        const { loopLocators, zoom } = useTrack.getState();
        if (!loopLocators || loopLocators.startPercent === 0 || loopLocators.startPercent === 1) return;
        zoom(loopLocators);
        draw();
      }
    },
    [draw, handleOnClickPlay],
  );

  if (status !== 'initialized') {
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
