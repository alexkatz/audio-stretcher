import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';
import { useParsedQuery } from 'src/common/useParsedQuery';
import { usePlayer } from '~/audio/usePlayer';
import { PlayButton } from './PlayButton';
import { SourceDisplay } from './SourceDisplay';

export const Analyze = () => {
  const isPlaying = usePlayer((player) => player.isPlaying);
  const isReady = usePlayer((player) => player.isReady);
  const source = usePlayer((player) => player.source);
  const play = usePlayer((player) => player.play);
  const pause = usePlayer((player) => player.pause);

  const router = useRouter();
  const { source: urlSource } = useParsedQuery<{ source?: string }>();

  useEffect(() => {
    if (source == null && urlSource != null) {
      // player.initialize()
    }
  }, [source, urlSource]);

  const handleOnClickPlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const handleOnClickBack = useCallback(() => {
    router.push('/');
  }, [router]);

  if (!isReady) {
    return <div>almost ready...</div>;
  }

  return (
    <div className='flex flex-col items-center relative h-screen'>
      <button onClick={handleOnClickBack}>Back</button>
      <SourceDisplay />
      <span className='mt-60'>
        <PlayButton
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOnClickPlay}
          isPlaying={isPlaying}
        />
      </span>
    </div>
  );
};
