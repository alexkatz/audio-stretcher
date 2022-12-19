import { useMemo } from 'react';
import { useTrack } from '~/audio/useTrack';
import clsx from 'clsx';
import { getIsValidYoutubeUrl } from '~/utils/validateYoutubeUrl';

type Props = {
  className?: string;
};

export const SourceDisplay = ({ className }: Props) => {
  const displayName = useTrack(track => track.displayName);
  const source = useTrack(track => track.source);
  const sourceIsUrl = useMemo(() => source != null && getIsValidYoutubeUrl(source), [source]);
  return (
    <div className={clsx('flex select-none flex-col items-end p-1 font-light', className)}>
      <a className='text-lg' target='_blank' href={sourceIsUrl ? source : undefined} rel='noreferrer'>
        {displayName}
      </a>
    </div>
  );
};
