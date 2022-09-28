import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { useStore } from '~/audio/useStore';
import { LoadableInput } from '~/components/LoadableInput';

type Props = {
  inputRef?: React.Ref<HTMLInputElement>;
  isDragActive?: boolean;
  isLoadingFile?: boolean;
};

export const YoutubeInput = ({ inputRef, isDragActive = false, isLoadingFile = false }: Props) => {
  const router = useRouter();
  const youtubeUrl = useStore((store) => store.youtubeUrl);
  const setYoutubeUrl = useStore((store) => store.setYoutubeUrl);
  const isValidYoutubeUrl = useStore((store) => store.isValidYoutubeUrl);
  const getSessionFromYoutube = useStore((store) => store.getSessionFromYoutube);
  const cancelDownload = useStore((store) => store.cancelGetSessionFromYoutube);
  const isDownloading = useStore((store) => store.isDownloadingAudio);
  const downloadProgress = useStore((store) => store.downloadProgress);

  const handleOnClickGetAudio = useCallback(async () => {
    if (isDownloading) {
      cancelDownload();
      return;
    }

    const session = await getSessionFromYoutube();
    if (session != null) {
      router.push('/analyze', `/analyze?source=${encodeURIComponent(session.source)}`);
    }
  }, [cancelDownload, getSessionFromYoutube, isDownloading, router]);

  return (
    <div className='flex gap-2 w-full'>
      <AnimatePresence>
        <LoadableInput
          key='youtube-url'
          containerClassName='flex-1'
          ref={inputRef}
          initial={{ opacity: 0 }}
          progress={downloadProgress}
          animate={{ opacity: isDragActive || isLoadingFile ? 0 : 1 }}
          exit={{ opacity: 0 }}
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          type='text'
          placeholder='youtube url...'
          disabled={isDownloading}
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
            {isDownloading ? 'cancel' : 'go'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
