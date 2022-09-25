import { useRouter } from 'next/router';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AddSessionParams, db } from 'src/common/db';
import { DbQueryKey } from 'src/common/DbQueryKey';
import { getAudioBufferFromFile } from '~/audio/getArrayBufferFromAudioFile';
import { usePlayer } from '~/audio/usePlayer';

export const useFileDrop = () => {
  const router = useRouter();
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [droppedFileName, setDroppedFileName] = useState('');

  const initializePlayer = usePlayer((player) => player.initialize);

  const queryClient = useQueryClient();

  const mutation = useMutation(
    [DbQueryKey.Sessions],
    async (session: AddSessionParams) => await db.addSession(session),
  );

  const dropzoneState = useDropzone({
    noClick: true,
    maxFiles: 1,
    accept: { 'audio/*': [] },
    async onDrop([accepted]) {
      try {
        if (accepted == null) throw Error('Could not load file');
        setIsLoadingFile(true);
        setDroppedFileName(accepted.name);

        const audioBuffer = await getAudioBufferFromFile(accepted);
        const displayName = accepted.name;
        const source = accepted.name;

        await mutation.mutateAsync({
          displayName,
          audioBuffer,
          source,
        });

        initializePlayer({
          audioBuffer,
          displayName,
          source,
        });

        router.push('/analyze', `/analyze?source=${source}`);
        queryClient.invalidateQueries([DbQueryKey.Sessions]);
      } catch (error) {
        // TODO: handle error
        console.error(error);
      }
    },
  });

  return {
    ...dropzoneState,
    isLoadingFile,
    droppedFileName,
  } as const;
};
