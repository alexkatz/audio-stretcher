import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';
import { db } from 'src/common/db';
import { useParsedSource } from 'src/common/useParsedSource';
import { playerIsReady } from '~/audio/playerIsReady';
import { usePlayer } from '~/audio/usePlayer';
import { useStore } from '~/audio/useStore';

export const useInitializeAnalyze = () => {
  const router = useRouter();
  const parsedSource = useParsedSource();
  const status = usePlayer(player => player.status);
  const initialize = usePlayer(player => player.initialize);
  const getSessionFromDb = useStore(store => store.getSessionFromDb);

  const handleInitialize = useCallback(async () => {
    const session = parsedSource ? await getSessionFromDb(parsedSource) : undefined;
    if (!session) return;
    // TODO: if no session found in db and parsedSource is valid youtube url,
    // send back to landing and autopopulate or auto get audio
    await initialize(session);

    if (playerIsReady(status)) {
      await db.updateLastOpenedAt(session.source);
    }
  }, [getSessionFromDb, initialize, parsedSource, status]);

  useEffect(() => {
    if (parsedSource && status === 'uninitialized') {
      handleInitialize();
    }
  }, [handleInitialize, status, parsedSource]);

  useEffect(() => {
    if (status === 'failed-to-initialize') {
      router.push('/');
    }
  }, [router, status]);
};
