import useResizeObserver from 'use-resize-observer';
import { c } from '~/utils/classnames';
import { TrackCanvas } from './TrackCanvas';

type Props = {
  className?: string;
};

export const Track = ({ className }: Props) => {
  const { ref: canvasContainerRef, width, height } = useResizeObserver();

  return (
    <div ref={canvasContainerRef} className={c('cursor-text', className)}>
      {width && height && <TrackCanvas width={width} height={height} />}
    </div>
  );
};
