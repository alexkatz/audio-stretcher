import { useRouter } from 'next/router';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AddSessionOptions, db, DbQueryKey } from 'src/common/db';

export const useFileDrop = () => {
  const router = useRouter();
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [droppedFileName, setDroppedFileName] = useState('');

  const queryClient = useQueryClient();

  const mutation = useMutation(
    [DbQueryKey.Sessions],
    async (session: AddSessionOptions) => await db.addSession(session),
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

        await mutation.mutateAsync({
          displayName: accepted.name,
          file: accepted,
          source: accepted.name,
        });

        router.push('/analyze', `/analyze?source=${accepted.name}`);
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
