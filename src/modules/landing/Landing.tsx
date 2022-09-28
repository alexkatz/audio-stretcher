import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePlayer } from '~/audio/usePlayer';
import { useStore } from '~/audio/useStore';
import { Busy } from '~/components/Busy';
import { RecentSessions } from './RecentSessions';
import { useFileDrop } from './useFileDrop';
import { YoutubeInput } from './YoutubeInput';

export const Landing = () => {
  const inputRef = useRef<HTMLInputElement>(null);

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

    useStore.setState({ downloadProgress: 0, youtubeUrl: '' });
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

      <YoutubeInput inputRef={inputRef} isDragActive={isDragActive} isLoadingFile={isLoadingFile} />

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
