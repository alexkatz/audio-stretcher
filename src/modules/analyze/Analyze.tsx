import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef } from 'react';
import { db } from 'src/common/db';
import { useParsedQuery } from 'src/common/useParsedQuery';
import { usePlayer } from '~/audio/usePlayer';
import { PlayButton } from './PlayButton';
import { SourceDisplay } from './SourceDisplay';

export const Analyze = () => {
  const player = usePlayer((player) => player);
  const router = useRouter();
  const isSourceInitialized = useRef(false);
  const { source } = useParsedQuery<{ source?: string }>();

  useEffect(() => {
    if (!isSourceInitialized.current && source != null) {
      player.initializeFromDb(db, source);
      isSourceInitialized.current = true;
    }
  }, [player, source]);

  const handleOnClickPlay = useCallback(() => {
    if (player.isPlaying) player.pause();
    else player.play();
  }, [player]);

  const handleOnClickBack = useCallback(() => {
    router.push('/');
  }, [router]);

  if (!player.isReady) {
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
          isPlaying={player.isPlaying}
        />
      </span>
    </div>
  );
};
