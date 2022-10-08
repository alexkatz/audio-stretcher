import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';
import { db } from 'src/common/db';
import { useParsedSource } from 'src/common/useParsedSource';
import { useStore } from '~/audio/useStore';
import { useTrack } from '~/audio/useTrack';

export const useInitializeAnalyze = () => {
  const router = useRouter();
  const parsedSource = useParsedSource();
  const status = useTrack(useTrack => useTrack.status);
  const initAudio = useTrack(useTrack => useTrack.initAudio);
  const getSessionFromDb = useStore(store => store.getSessionFromDb);

  const handleInitialize = useCallback(async () => {
    const session = parsedSource ? await getSessionFromDb(parsedSource) : undefined;
    if (!session) return;
    // TODO: if no session found in db and parsedSource is valid youtube url,
    // send back to landing and autopopulate or auto get audio
    const status = await initAudio(session);

    if (status === 'initialized') {
      await db.updateLastOpenedAt(session.source);
    }
  }, [getSessionFromDb, initAudio, parsedSource]);

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
