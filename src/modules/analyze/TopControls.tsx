import { useCallback, useEffect, useMemo, useRef } from 'react';
import { MotionProps } from 'framer-motion';
import { useTrack } from '~/audio/useTrack';
import { useKeyDown } from '~/hooks/useKeyboard';
import throttle from 'lodash.throttle';
import clsx from 'clsx';
import { CycleButton } from './CycleButton';
import { PlayButton } from './PlayButton';
import { TrackNumeric } from './TrackNumeric';
import { getTimeText } from 'src/common/getTimeText';

type Props = {
  className?: string;
};

const scaleProps: Pick<MotionProps, 'whileHover' | 'whileFocus' | 'whileTap'> = {
  whileHover: { scale: 1.05 },
  whileFocus: { scale: 1.05 },
  whileTap: { scale: 0.95 },
};

const updateZoomText = throttle((span: HTMLSpanElement, factor: number) => {
  span.textContent = `${Math.round((1 / factor + Number.EPSILON) * 100) / 100}x`;
}, 100);

export const TopControls = ({ className }: Props) => {
  const isPlaying = useTrack(track => track.isPlaying);
  const loopLocatorsExist = useTrack(track => track.loopLocators != null);
  const prevLoopLocatorsExist = useTrack(track => track.prevLoopLocators != null);
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

  const handleOnClickPlay = useCallback(() => {
    const { play, pause } = useTrack.getState();
    if (isPlaying) {
      pause().draw();
    } else {
      play();
    }
  }, [isPlaying]);

  const handleOnClickCycle = useCallback(() => {
    const { updateLocators, loopLocators, prevLoopLocators } = useTrack.getState();
    updateLocators('loop', loopLocators == null ? prevLoopLocators : undefined).draw();
  }, []);

  useKeyDown(
    ({ code }) => {
      if (code === 'Space') {
        handleOnClickPlay();
      }
    },
    [handleOnClickPlay],
  );

  const isCycleButtonEnabled = loopLocatorsExist || prevLoopLocatorsExist;

  return (
    <div
      className={clsx(
        'relative flex w-full select-none flex-row items-center justify-center text-base font-light',
        className,
      )}
    >
      <div className='absolute left-0 top-0 flex h-full items-start gap-3 pl-2'>
        {loopStart && <TrackNumeric label='START'>{loopStart}</TrackNumeric>}
        {loopEnd != null && <TrackNumeric label='END'>{loopEnd}</TrackNumeric>}
        {hoverTime != null && (
          <TrackNumeric label='CURSOR'>
            <span className='text-ivory/40'>{hoverTime}</span>
          </TrackNumeric>
        )}
      </div>

      <div className='flex items-center justify-center'>
        <PlayButton className='h-20 w-20' onClick={handleOnClickPlay} isPlaying={isPlaying} {...scaleProps} />

        <div className='flex h-full flex-1 flex-row items-center justify-start gap-2'>
          <CycleButton
            className='h-10 w-10'
            onClick={handleOnClickCycle}
            isActive={loopLocatorsExist}
            disabled={!isCycleButtonEnabled}
            {...(isCycleButtonEnabled ? scaleProps : undefined)}
          />
        </div>
      </div>

      <div className='absolute right-0 flex h-full items-start pr-2'>
        <TrackNumeric label='ZOOM' labelClassName='self-end'>
          <span ref={zoomSpanRef} />
        </TrackNumeric>
      </div>
    </div>
  );
};
