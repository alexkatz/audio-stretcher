import { useMemo } from 'react';
import { usePlayer } from '~/audio/usePlayer';
import { c } from '~/utils/classnames';
import { getIsValidYoutubeUrl } from '~/utils/validateYoutubeUrl';

type Props = {
  className?: string;
};

export const SourceDisplay = ({ className }: Props) => {
  const displayName = usePlayer(player => player.displayName);
  const source = usePlayer(player => player.source);
  const sourceIsUrl = useMemo(() => source != null && getIsValidYoutubeUrl(source), [source]);
  return (
    <div
      className={c(
        'absolute top-1 right-1 flex select-none flex-col items-end p-1 font-extralight text-slate-500',
        className,
      )}
    >
      <a className='text-lg' target='_blank' href={sourceIsUrl ? source : undefined} rel='noreferrer'>
        {displayName}
      </a>
    </div>
  );
};
