import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import { IoIosArrowRoundBack } from 'react-icons/io';
import { useTrack } from '~/audio/useTrack';
import { Slider } from '~/components/Slider';
import { SourceDisplay } from './SourceDisplay';
import { useInitializeAnalyze } from './useInitializeAnalyze';
import { Track } from './Track';
import { TopControls } from './TopControls';
import { ControlBox } from './ControlBox';
import { getPan } from 'src/common/getPan';

export const Analyze = () => {
  const router = useRouter();
  const status = useTrack(track => track.status);

  const gain = useTrack(track => track.gain);
  const setGain = useTrack(track => track.setGain);
  const pan = useTrack(track => track.pan);
  const setPan = useTrack(track => track.setPan);
  const isMono = useTrack(track => track.isMono);

  useInitializeAnalyze();

  const panDisplayText = useMemo(() => getPan(pan).toFixed(2), [pan]);

  const handleOnClickBack = useCallback(() => {
    router.push('/');
  }, [router]);

  if (status !== 'initialized') {
    return null;
  }

  return (
    <div className='relative flex h-screen flex-col items-center bg-black'>
      <Track className='relative h-1/2 w-full bg-gradient-to-b from-black to-black-200/40' />

      <button className='absolute top-0 left-0' onClick={handleOnClickBack}>
        <IoIosArrowRoundBack className='text-ivory/60' size={40} />
      </button>

      <SourceDisplay className='absolute top-0 right-0' />

      <TopControls />

      <div className='flex w-full flex-1 items-center justify-around'>
        <ControlBox className='h-5/6' label='GAIN' displayValue={gain.toFixed(2)}>
          <Slider vertical className='h-full' value={gain} onChange={setGain} />
        </ControlBox>
        <ControlBox disabled={isMono} label='PAN' displayValue={panDisplayText}>
          <Slider horizontal className='w-64' value={pan} onChange={setPan} />
        </ControlBox>
      </div>
    </div>
  );
};
