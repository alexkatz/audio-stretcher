import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { IoIosArrowRoundBack } from 'react-icons/io';
import { useTrack } from '~/audio/useTrack';
import { SourceDisplay } from './SourceDisplay';
import { useInitializeAnalyze } from './useInitializeAnalyze';
import { Track } from './Track';
import { TopControls } from './TopControls';

export const Analyze = () => {
  const router = useRouter();
  const status = useTrack(track => track.status);

  useInitializeAnalyze();

  const handleOnClickBack = useCallback(() => {
    router.push('/');
  }, [router]);

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
      <TopControls />
    </div>
  );
};
