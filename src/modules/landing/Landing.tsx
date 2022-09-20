import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Busy } from '~/components/Busy';
import { Input } from '~/components/Input';
import { RecentSessions } from './RecentSessions';
import { useFileDrop } from './useFileDrop';

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
      onClick={handleOnClickMain}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      <div className='text-5xl text-slate-500 select-none font-extralight'>[audio stretcher]</div>
      <span className='text-slate-500 text-2xl select-none'>{instructions}</span>

      {!isLoadingFile && (
        <AnimatePresence>
          {!isDragActive && !isLoadingFile && (
            <Input
              className='w-full border-slate-text-slate-500 placeholder-slate-600 caret-slate-text-slate-500 text-slate-400'
              ref={inputRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key='youtube-url'
              type='text'
              placeholder='youtube url...'
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {isLoadingFile && (
          <motion.span key='busy' initial={{ opacity: 0 }} exit={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Busy />
          </motion.span>
        )}
      </AnimatePresence>

      <RecentSessions className='flex-1  w-full' />
    </main>
  );
};
