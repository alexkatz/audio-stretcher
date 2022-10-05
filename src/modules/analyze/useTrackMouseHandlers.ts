import { useState, useCallback, MouseEvent } from 'react';
import { usePlayer } from '~/audio/usePlayer';
import { useTrack } from './useTrack';

const MIN_LOOP_PERCENT = 0.001;

type MouseState = {
  isMouseDown: boolean;
  lastMouseDownPercent: number;
  didSetLoopOnMouseDown: boolean;
};

const arePercentsEqual = (a: number, b: number) => Math.abs(a - b) < MIN_LOOP_PERCENT;

export const useTrackMouseHandlers = () => {
  const draw = useTrack(track => track.draw);
  const { width = 1 } = useTrack(track => track.canvasDomSize);
  const updateLocators = usePlayer(player => player.updateLocators);

  const [mouseState, setMouseState] = useState<MouseState>({
    didSetLoopOnMouseDown: false,
    isMouseDown: false,
    lastMouseDownPercent: 0,
  });

  const handleOnMouseMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const { lastMouseDownPercent, isMouseDown } = mouseState;
      if (!isMouseDown) {
        updateLocators('hover', { startPercent: e.clientX / width });
      } else {
        updateLocators('loop', locators => {
          if (!locators) return undefined;

          const newPercent = e.clientX / width;

          if (lastMouseDownPercent < newPercent && !arePercentsEqual(lastMouseDownPercent, newPercent)) {
            return { startPercent: lastMouseDownPercent, endPercent: newPercent };
          }

          if (!arePercentsEqual(newPercent, lastMouseDownPercent)) {
            return { startPercent: newPercent, endPercent: lastMouseDownPercent };
          }

          return { startPercent: lastMouseDownPercent };
        });
      }

      draw();
    },
    [draw, mouseState, updateLocators, width],
  );

  const handleOnMouseDown = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const percent = e.clientX / width;

      const loopLocators = usePlayer.getState().loopLocators;

      setMouseState({
        didSetLoopOnMouseDown: !loopLocators || !arePercentsEqual(loopLocators.startPercent, percent),
        isMouseDown: true,
        lastMouseDownPercent: percent,
      });

      updateLocators('loop', { startPercent: percent });
      draw();
    },
    [draw, updateLocators, width],
  );

  const handleOnMouseUp = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const percent = e.clientX / width;
      const { lastMouseDownPercent, didSetLoopOnMouseDown } = mouseState;
      if (!didSetLoopOnMouseDown && Math.abs(lastMouseDownPercent - percent) < MIN_LOOP_PERCENT) {
        updateLocators('loop', undefined);
        draw();
      }

      setMouseState(state => ({
        lastMouseDownPercent: state.lastMouseDownPercent,
        isMouseDown: false,
        didSetLoopOnMouseDown: false,
      }));
    },
    [draw, mouseState, updateLocators, width],
  );

  const handleOnMouseLeave = useCallback(() => {
    updateLocators('hover', undefined);
    draw();
  }, [draw, updateLocators]);

  return {
    handleOnMouseDown,
    handleOnMouseLeave,
    handleOnMouseMove,
    handleOnMouseUp,
  };
};
