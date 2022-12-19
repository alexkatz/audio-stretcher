import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useStore } from '~/audio/useStore';
import { useTrack } from '~/audio/useTrack';
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
    const { status, clear } = useTrack.getState();

    inputRef.current?.focus();

    if (status === 'failed-to-initialize') {
      // TODO: toast or something
    }

    useStore.setState({ downloadProgress: 0, youtubeUrl: '' });
    clear();
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
          {'Loading '} <span>{droppedFileName}</span>
          {'...'}
        </>
      );
    }

    return (
      <>
        {'paste in a youtube url, or drag in an '}
        <span className='font-normal underline hover:cursor-pointer' onClick={() => open()}>
          {'audio file'}
        </span>
        {'.'}
      </>
    );
  }, [droppedFileName, isDragAccept, isDragReject, isLoadingFile, open]);

  return (
    <main
      className='container mx-auto flex h-screen flex-col items-center gap-12 bg-black p-4 pt-32 focus:outline-0'
      {...getRootProps()}
      onClick={handleOnClickMain}
    >
      <input {...getInputProps()} />
      <div className='select-none text-5xl font-extralight'>[audio stretcher]</div>
      <span className='select-none text-2xl font-extralight'>{instructions}</span>

      <YoutubeInput inputRef={inputRef} isDragActive={isDragActive} isLoadingFile={isLoadingFile} />

      <AnimatePresence>
        {isLoadingFile && (
          <motion.span key='busy' initial={{ opacity: 0 }} exit={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Busy />
          </motion.span>
        )}
      </AnimatePresence>

      <RecentSessions animate={{ opacity: isDragActive || isLoadingFile ? 0 : 1 }} className='w-full  flex-1' />
    </main>
  );
};
