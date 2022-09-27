import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePlayer } from '~/audio/usePlayer';
import { useStore } from '~/audio/useStore';
import { Busy } from '~/components/Busy';
import { Input } from '~/components/Input';
import { RecentSessions } from './RecentSessions';
import { useFileDrop } from './useFileDrop';

export const Landing = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const youtubeUrl = useStore((store) => store.youtubeUrl);
  const setYoutubeUrl = useStore((store) => store.setYoutubeUrl);
  const isValidYoutubeUrl = useStore((store) => store.isValidYoutubeUrl);
  const getSessionFromYoutube = useStore((store) => store.getSessionFromYoutube);

  const {
    open,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    isLoadingFile,
    droppedFileName,
  } = useFileDrop();

  useEffect(() => {
    inputRef.current?.focus();

    const failedToInitialize = usePlayer.getState().status === 'failed-to-initialize';
    if (failedToInitialize) {
      // TODO: toast or something
    }

    usePlayer.getState().clear();
  }, []);

  const handleOnClickMain = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleOnClickGetAudio = useCallback(async () => {
    const session = await getSessionFromYoutube();
    if (session != null) {
      router.push('/analyze', `/analyze?source=${encodeURIComponent(session.source)}`);
    }
  }, [getSessionFromYoutube, router]);

  const instructions = useMemo(() => {
    if (isDragReject) return 'Incompatible file. Try another...';
    if (isDragAccept) return 'Drop anywhere...';
    if (isLoadingFile) {
      return (
        <>
          {'Loading '} <span className='text-slate-500'>{droppedFileName}</span>
          {'...'}
        </>
      );
    }

    return (
      <>
        {'paste in a youtube url, or drag in an '}
        <span className='hover:cursor-pointer underline font-normal text-slate-500' onClick={() => open()}>
          {'audio file'}
        </span>
        {'.'}
      </>
    );
  }, [droppedFileName, isDragAccept, isDragReject, isLoadingFile, open]);

  return (
    <main
      className='container flex flex-col items-center gap-12 h-screen mx-auto bg-black p-4 pt-32 focus:outline-0'
      {...getRootProps()}
      onClick={handleOnClickMain}
    >
      <input {...getInputProps()} />
      <div className='text-5xl text-slate-500 select-none font-extralight'>[audio stretcher]</div>
      <span className=' font-extralight text-slate-500 text-2xl select-none'>{instructions}</span>

      <div className='flex gap-2 w-full'>
        <AnimatePresence>
          <Input
            key='youtube-url'
            className='flex-1'
            ref={inputRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: isDragActive || isLoadingFile ? 0 : 1 }}
            exit={{ opacity: 0 }}
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            type='text'
            placeholder='youtube url...'
            onClick={(e) => e.stopPropagation()}
          />
        </AnimatePresence>
        <AnimatePresence>
          {isValidYoutubeUrl && (
            <motion.button
              className='border border-slate-500 rounded px-2 bg-slate-500 text-black'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.03, opacity: 1 }}
              whileTap={{ scale: 1.02 }}
              key='get-audio'
              onClick={handleOnClickGetAudio}
            >
              get audio
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isLoadingFile && (
          <motion.span key='busy' initial={{ opacity: 0 }} exit={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Busy />
          </motion.span>
        )}
      </AnimatePresence>

      <RecentSessions animate={{ opacity: isDragActive || isLoadingFile ? 0 : 1 }} className='flex-1  w-full' />
    </main>
  );
};
