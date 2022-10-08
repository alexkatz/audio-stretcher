import { useRouter } from 'next/router';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStore } from '~/audio/useStore';
import { InitializeParams, useTrack } from '../../common/audio/useTrack';

export const useFileDrop = () => {
  const router = useRouter();
  const createSession = useStore(store => store.createSession);
  const initAudio = useTrack(track => track.initAudio);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [droppedFileName, setDroppedFileName] = useState('');

  const dropzoneState = useDropzone({
    noClick: true,
    maxFiles: 1,
    accept: { 'audio/*': [] },
    async onDrop([accepted]) {
      try {
        if (accepted == null) throw Error('Could not load file');
        setIsLoadingFile(true);
        setDroppedFileName(accepted.name);

        const params: InitializeParams = {
          arrayBuffer: await accepted.arrayBuffer(),
          displayName: accepted.name,
          source: accepted.name,
        };

        await createSession(params);
        await initAudio(params);

        router.push('/analyze', `/analyze?source=${encodeURIComponent(params.source)}`);
      } catch (error) {
        // TODO: handle error
        console.log(error);
      }
    },
  });

  return {
    ...dropzoneState,
    isLoadingFile,
    droppedFileName,
  } as const;
};
