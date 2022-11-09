import { useCallback } from 'react';
import { MotionProps } from 'framer-motion';
import { useTrack } from '~/audio/useTrack';
import { useKeydown } from '~/hooks/useKeyboard';
import { c } from '~/utils/classnames';
import { CycleButton } from './CycleButton';
import { PlayButton } from './PlayButton';

type Props = {
  className?: string;
};

const scaleProps: Pick<MotionProps, 'whileHover' | 'whileFocus' | 'whileTap'> = {
  whileHover: { scale: 1.05 },
  whileFocus: { scale: 1.05 },
  whileTap: { scale: 0.95 },
};

export const TopControls = ({ className }: Props) => {
  const isPlaying = useTrack(track => track.isPlaying);
  const loopLocatorsExist = useTrack(track => track.loopLocators != null);
  const prevLoopLocatorsExist = useTrack(track => track.prevLoopLocators != null);

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

  useKeydown(
    ({ code }) => {
      if (code === 'Space') {
        handleOnClickPlay();
      }
    },
    [handleOnClickPlay],
  );

  const isCycleButtonEnabled = loopLocatorsExist || prevLoopLocatorsExist;

  return (
    <div className={c('flex w-full flex-row items-center justify-center', className)}>
      <div className='h-full flex-1 items-center justify-end gap-2'></div>

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
  );
};
