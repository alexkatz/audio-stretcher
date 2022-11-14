import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { IoIosArrowRoundBack } from 'react-icons/io';
import { useTrack } from '~/audio/useTrack';
import { Slider } from '~/components/Slider';
import { SourceDisplay } from './SourceDisplay';
import { useInitializeAnalyze } from './useInitializeAnalyze';
import { Track } from './Track';
import { TopControls } from './TopControls';

export const Analyze = () => {
  const router = useRouter();
  const status = useTrack(track => track.status);

  const [gain, setGain] = useState(0.5);

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
      <Slider horizontal className='w-96' value={gain} onChange={setGain} />
      <Slider vertical className='h-48' value={gain} onChange={setGain} />
    </div>
  );
};
