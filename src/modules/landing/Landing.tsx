import { useDropzone } from 'react-dropzone';
import { Input } from '../../common/components/Input';

export const Landing = () => {
  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, open, acceptedFiles, fileRejections } =
    useDropzone({
      noClick: true,
      maxFiles: 1,
      accept: { 'audio/*': [] },
      onDrop(accepted) {},
      // TODO: https://github.com/olvb/phaze/
    });

  return (
    <main
      className='container flex flex-col items-center gap-12 min-h-screen mx-auto bg-black p-4 pt-32 focus:outline-0'
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      <div>
        <div className='text-5xl text-slate-300 select-none'>[audio stretcher]</div>
      </div>
      <Input
        autoFocus
        type='text'
        placeholder='youtube url...'
        disabled={isDragActive}
        className='w-full'
        onClick={(e) => e.stopPropagation()}
      />
      <span className='text-slate-500'>
        or drag in an{' '}
        <span className='hover:cursor-pointer underline text-slate-400' onClick={() => open()}>
          audio file
        </span>
      </span>
    </main>
  );
};
