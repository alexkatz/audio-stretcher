import { usePlayer } from '~/audio/usePlayer';
import { c } from '~/utils/classnames';

type Props = {
  className?: string;
};

export const SourceDisplay = ({ className }: Props) => {
  const displayName = usePlayer((player) => player.displayName);
  const source = usePlayer((player) => player.source);
  return (
    <div className={c('absolute top-0 right-0 p-1 text-slate-600 select-none font-extralight', className)}>
      <div className='text-xl'>{displayName}</div>
      {displayName && source && source !== displayName && <div className='text-sm'>{source}</div>}
    </div>
  );
};
