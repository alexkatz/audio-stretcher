import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { KeyboardEvent, useCallback } from 'react';
import { useStore } from '~/audio/useStore';
import { LoadableInput } from '~/components/LoadableInput';
import { CodeKey } from '~/hooks/CodeKey';

type Props = {
  inputRef?: React.Ref<HTMLInputElement>;
  isDragActive?: boolean;
  isLoadingFile?: boolean;
};

export const YoutubeInput = ({ inputRef, isDragActive = false, isLoadingFile = false }: Props) => {
  const router = useRouter();
  const youtubeUrl = useStore(store => store.youtubeUrl);
  const setYoutubeUrl = useStore(store => store.setYoutubeUrl);
  const isValidYoutubeUrl = useStore(store => store.isValidYoutubeUrl);
  const getSessionFromYoutube = useStore(store => store.getSessionFromYoutube);
  const cancelDownload = useStore(store => store.cancelGetSessionFromYoutube);
  const isDownloading = useStore(store => store.isDownloadingAudio);
  const downloadProgress = useStore(store => store.downloadProgress);

  const handleGetAudio = useCallback(async () => {
    if (isDownloading) {
      cancelDownload();
      return;
    }

    const session = await getSessionFromYoutube();
    if (session != null) {
      router.push('/analyze', `/analyze?source=${encodeURIComponent(session.source)}`);
    }
  }, [cancelDownload, getSessionFromYoutube, isDownloading, router]);

  const handleOnKeyDown = useCallback(
    (e: CodeKey<KeyboardEvent<HTMLInputElement>>) => {
      if (e.code === 'Enter') {
        handleGetAudio();
      }
    },
    [handleGetAudio],
  );

  return (
    <div className='flex w-full gap-2'>
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
          onChange={e => setYoutubeUrl(e.target.value)}
          type='text'
          placeholder='youtube url...'
          disabled={isDownloading}
          onClick={e => e.stopPropagation()}
          onKeyDown={handleOnKeyDown}
        />
      </AnimatePresence>
      <AnimatePresence>
        {isValidYoutubeUrl && (
          <motion.button
            className='rounded border border-ivory bg-ivory px-2 text-black'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.03, opacity: 1 }}
            whileTap={{ scale: 1.02 }}
            key='get-audio'
            onClick={handleGetAudio}
          >
            {isDownloading ? 'cancel' : 'go'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
