import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { IoIosArrowRoundBack } from 'react-icons/io';
import { useKeydown } from '~/hooks/useKeyboard';
import { useTrack } from '~/audio/useTrack';
import { PlayButton } from './PlayButton';
import { SourceDisplay } from './SourceDisplay';
import { useInitializeAnalyze } from './useInitializeAnalyze';
import { Track } from './Track';

export const Analyze = () => {
  const router = useRouter();
  const status = useTrack(track => track.status);
  const isPlaying = useTrack(track => track.isPlaying);

  useInitializeAnalyze();

  const handleOnClickPlay = useCallback(() => {
    const { play, pause } = useTrack.getState();
    if (isPlaying) {
      pause().draw();
    } else {
      play();
    }
  }, [isPlaying]);

  const handleOnClickBack = useCallback(() => {
    router.push('/');
  }, [router]);

  useKeydown(
    ({ code, shiftKey }) => {
      const { loopLocators, zoom, updateLocators, zoomLocators } = useTrack.getState();

      if (code === 'Space') {
        handleOnClickPlay();
      } else if (!shiftKey && code === 'KeyZ') {
        if (!loopLocators || loopLocators.start === 0 || loopLocators.start === 1) return;
        zoom(loopLocators).draw();
      } else if (shiftKey && code === 'KeyZ') {
        zoom({ start: 0, end: 1, reset: true }).updateLocators('loop', zoomLocators).draw();
      } else if (code === 'Escape') {
        updateLocators('loop', undefined).draw();
      }
    },
    [handleOnClickPlay],
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
