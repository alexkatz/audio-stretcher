import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Busy } from '~/components/Busy';
import { Input } from '~/components/Input';

export const Landing = () => {
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileName, setFileName] = useState('');

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, open } = useDropzone({
    noClick: true,
    maxFiles: 1,
    accept: { 'audio/*': [] },
    onDrop([accepted]) {
      setIsLoadingFile(true);
      if (accepted) setFileName(accepted?.name ?? 'file');
    },
    // TODO: https://github.com/olvb/phaze/
  });

  const instructions = useMemo(() => {
    if (isDragReject) return 'Incompatible file. Try another...';
    if (isDragAccept) return 'Drop anywhere...';
    if (isLoadingFile)
      return (
        <>
          Loading <span className='text-slate-400'>{fileName}</span>...
        </>
      );
    return (
      <>
        {'paste in a youtube url, or drag in an '}
        <span className='hover:cursor-pointer underline text-slate-400' onClick={() => open()}>
          {'audio file'}
        </span>
        {'.'}
      </>
    );
  }, [fileName, isDragAccept, isDragReject, isLoadingFile, open]);

  return (
    <main
      className='container flex flex-col items-center gap-12 min-h-screen mx-auto bg-black p-4 pt-32 focus:outline-0'
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      <motion.div className='text-5xl text-slate-700 select-none font-extralight'>[audio stretcher]</motion.div>

      <span className='text-slate-700 text-2xl'>{instructions}</span>

      {!isLoadingFile && (
        <AnimatePresence>
          {!isDragActive && !isLoadingFile && (
            <Input
              className='w-full border-slate-700 placeholder-slate-800 caret-slate-700 text-slate-400'
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
    </main>
  );
};
