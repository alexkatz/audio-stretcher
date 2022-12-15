import { useEffect, useMemo, useRef } from 'react';
import throttle from 'lodash.throttle';
import { useTrack } from '~/audio/useTrack';
import { c } from '~/utils/classnames';
import { getTimeText } from 'src/common/getTimeText';

type Props = {
  className?: string;
};

const updateZoomText = throttle((span: HTMLSpanElement, factor: number) => {
  span.textContent = `${Math.round((1 / factor + Number.EPSILON) * 100) / 100}x`;
}, 100);

export const TrackNumerics = ({ className }: Props) => {
  const loopLocators = useTrack(track => track.loopLocators);
  const hoverStart = useTrack(track => track.hoverLocators?.start);
  const audioBuffer = useTrack(track => track.audioBuffer);
  const zoomSpanRef = useRef<HTMLSpanElement>(null);

  const [loopStart, loopEnd] = useMemo(() => {
    if (!audioBuffer) return [];
    const loopStart = getTimeText((loopLocators?.start ?? 0) * audioBuffer.duration);
    const loopEnd = getTimeText((loopLocators?.end ?? 1) * audioBuffer.duration);
    return [loopStart, loopEnd] as const;
  }, [audioBuffer, loopLocators?.end, loopLocators?.start]);

  const hoverTime = useMemo(
    () => (hoverStart == null || audioBuffer == null ? null : getTimeText(hoverStart * audioBuffer.duration)),
    [audioBuffer, hoverStart],
  );

  useEffect(
    () =>
      useTrack.subscribe(track => {
        if (zoomSpanRef.current == null) return;
        updateZoomText(zoomSpanRef.current, track.zoomState.factor);
      }),
    [],
  );

  return (
    <div className={c('flex select-none flex-row items-center justify-between p-2 text-xl text-primary', className)}>
      <div className='flex flex-row items-center justify-start gap-2'>
        {loopStart != null && <span>{loopStart}</span>}
        {loopEnd != null && <span>{loopEnd}</span>}
        {hoverTime != null && <span className='opacity-50'>{hoverTime}</span>}
      </div>

      <div className='flex flex-row items-center justify-end'>
        <span ref={zoomSpanRef} />
      </div>
    </div>
  );
};
