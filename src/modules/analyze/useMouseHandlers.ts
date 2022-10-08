import { useState, useCallback, MouseEvent } from 'react';
import { Locators, useTrack } from '../../common/audio/useTrack';

const MIN_LOOP_PERCENT = 0.001;

type MouseState = {
  isMouseDown: boolean;
  lastMouseDownPercent: number;
  didSetLoopOnMouseDown: boolean;
};

const getShiftLocators = (percent: number, locators: Locators): Locators => {
  const middlePercent = locators.endPercent ? (locators.startPercent + locators.endPercent) / 2 : locators.startPercent;

  if (percent < middlePercent) {
    return { startPercent: percent, endPercent: locators.endPercent ?? locators.startPercent };
  }

  return { startPercent: locators.startPercent, endPercent: percent };
};

const arePercentsEqual = (a: number, b: number) => Math.abs(a - b) < MIN_LOOP_PERCENT;

export const useMouseHandlers = () => {
  const draw = useTrack(track => track.draw);
  const { width = 1 } = useTrack(track => track.canvasDomSize);
  const updateLocators = useTrack(track => track.updateLocators);

  const [mouseState, setMouseState] = useState<MouseState>({
    didSetLoopOnMouseDown: false,
    isMouseDown: false,
    lastMouseDownPercent: 0,
  });

  const handleOnMouseMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const { clientX, shiftKey } = e;
      const { lastMouseDownPercent, isMouseDown } = mouseState;
      const percent = clientX / width;

      if (!isMouseDown) {
        updateLocators('hover', { startPercent: percent });
      } else {
        updateLocators('loop', locators => {
          if (!locators) return undefined;

          if (shiftKey) return getShiftLocators(percent, locators);

          if (lastMouseDownPercent < percent && !arePercentsEqual(lastMouseDownPercent, percent)) {
            return { startPercent: lastMouseDownPercent, endPercent: percent };
          }

          if (!arePercentsEqual(percent, lastMouseDownPercent)) {
            return { startPercent: percent, endPercent: lastMouseDownPercent };
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
      const { shiftKey, clientX } = e;
      const { loopLocators } = useTrack.getState();
      const percent = clientX / width;

      setMouseState({
        didSetLoopOnMouseDown: !loopLocators || !arePercentsEqual(loopLocators.startPercent, percent),
        isMouseDown: true,
        lastMouseDownPercent: percent,
      });

      updateLocators('loop', locators => {
        if (!shiftKey || !locators) return { startPercent: percent };
        return getShiftLocators(percent, locators);
      });

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
