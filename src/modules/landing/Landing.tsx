import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePlayer } from '~/audio/usePlayer';
import { Busy } from '~/components/Busy';
import { Input } from '~/components/Input';
import { RecentSessions } from './RecentSessions';
import { useFileDrop } from './useFileDrop';
import { useYoutubeUrl } from './useYoutubeUrl';

export const Landing = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const { youtubeUrl, setYoutubeUrl, isValidYoutubeUrl, handleGetAudioFromUrl } = useYoutubeUrl();

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
    usePlayer.getState().clear();
  }, []);

  const handleOnClickMain = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const instructions = useMemo(() => {
    if (isDragReject) return 'Incompatible file. Try another...';
    if (isDragAccept) return 'Drop anywhere...';
    if (isLoadingFile) {
      return (
        <>
          {'Loading '} <span className='text-slate-400'>{droppedFileName}</span>
          {'...'}
        </>
      );
    }

    return (
      <>
        {'paste in a youtube url, or drag in an '}
        <span className='hover:cursor-pointer underline text-slate-400' onClick={() => open()}>
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
      <span className='text-slate-700 text-2xl select-none'>{instructions}</span>

      <div className='flex gap-2 w-full'>
        <AnimatePresence>
          <Input
            key='youtube-url'
            className='border-slate-400 flex-1 placeholder-slate-600 caret-slate-text-slate-500 text-slate-400'
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
              className='border border-slate-400 rounded px-2 bg-slate-400 text-black'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.03, opacity: 1 }}
              whileTap={{ scale: 1.02 }}
              key='get-audio'
              onClick={handleGetAudioFromUrl}
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
