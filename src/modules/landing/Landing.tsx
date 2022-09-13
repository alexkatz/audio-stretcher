import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Busy } from '~/components/Busy';
import { Input } from '~/components/Input';
import { getArrayBufferFromAudioFile } from '~/audio/getArrayBufferFromAudioFile';
import { useRouter } from 'next/router';
import { createPlayer } from '~/audio/createPlayer';

export const Landing = () => {
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, open } = useDropzone({
    noClick: true,
    maxFiles: 1,
    accept: { 'audio/*': [] },
    async onDrop([accepted]) {
      try {
        if (accepted == null) throw Error('Could not load file');
        setIsLoadingFile(true);
        setFileName(accepted?.name ?? 'file');
        const buffer = await getArrayBufferFromAudioFile(accepted);
        const player = await createPlayer(buffer);
        router.push('/analyze');
      } catch (error) {
        // TODO: handle error
        console.error(error);
      }
    },
    // TODO: https://github.com/olvb/phaze/
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    </main>
  );
};
