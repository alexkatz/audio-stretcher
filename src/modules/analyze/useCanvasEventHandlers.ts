import { useState, useCallback, MouseEvent, ComponentPropsWithoutRef, useLayoutEffect } from 'react';
import { Locators, useTrack } from '../../common/audio/useTrack';

const MIN_LOOP_PERCENT = 0.001;

type MouseState = {
  isMouseDown: boolean;
  lastMouseDownPercent: number;
  didSetLoopOnMouseDown: boolean;
};

const getShiftedLoopLocators = (percent: number, locators: Locators): Locators => {
  const middlePercent = locators.end ? (locators.start + locators.end) / 2 : locators.start;

  if (percent < middlePercent) {
    return { start: percent, end: locators.end ?? locators.start };
  }

  return { start: locators.start, end: percent };
};

const getUpdatedLoopLocators = (lastMouseDownPercent: number, percent: number): Locators => {
  if (lastMouseDownPercent < percent && !arePercentsEqual(lastMouseDownPercent, percent)) {
    return { start: lastMouseDownPercent, end: percent };
  }

  if (!arePercentsEqual(percent, lastMouseDownPercent)) {
    return { start: percent, end: lastMouseDownPercent };
  }

  return { start: lastMouseDownPercent };
};

const arePercentsEqual = (a: number, b: number) => Math.abs(a - b) < MIN_LOOP_PERCENT;

export const useCanvasEventHandlers = (canvas: HTMLCanvasElement | null): ComponentPropsWithoutRef<'canvas'> => {
  const { width = 1 } = useTrack(track => track.canvasDomSize);

  const [mouseState, setMouseState] = useState<MouseState>({
    didSetLoopOnMouseDown: false,
    isMouseDown: false,
    lastMouseDownPercent: 0,
  });

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const { updateLocators } = useTrack.getState();
      const { clientX, shiftKey } = e;
      const { lastMouseDownPercent, isMouseDown } = mouseState;
      const percent = clientX / width;
      if (!isMouseDown) {
        updateLocators('hover', { start: percent }).draw();
      } else {
        updateLocators('loop', locators => {
          if (!locators) return undefined;
          return shiftKey
            ? getShiftedLoopLocators(percent, locators)
            : getUpdatedLoopLocators(lastMouseDownPercent, percent);
        }).draw();
      }
    },
    [mouseState, width],
  );

  const onMouseDown = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const { shiftKey, clientX } = e;
      const { loopLocators, updateLocators } = useTrack.getState();
      const percent = clientX / width;

      setMouseState({
        didSetLoopOnMouseDown: !loopLocators || !arePercentsEqual(loopLocators.start, percent),
        isMouseDown: true,
        lastMouseDownPercent: percent,
      });

      updateLocators('loop', locators => {
        if (!shiftKey || !locators) return { start: percent };
        return getShiftedLoopLocators(percent, locators);
      }).draw();
    },
    [width],
  );

  const onMouseUp = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const percent = e.clientX / width;
      const { updateLocators } = useTrack.getState();
      const { lastMouseDownPercent, didSetLoopOnMouseDown } = mouseState;
      if (!didSetLoopOnMouseDown && Math.abs(lastMouseDownPercent - percent) < MIN_LOOP_PERCENT) {
        updateLocators('loop', undefined).draw();
      }

      setMouseState(state => ({
        lastMouseDownPercent: state.lastMouseDownPercent,
        isMouseDown: false,
        didSetLoopOnMouseDown: false,
      }));
    },
    [mouseState, width],
  );

  const onMouseLeave = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const { updateLocators, draw } = useTrack.getState();
      updateLocators('hover', undefined);
      const { lastMouseDownPercent, didSetLoopOnMouseDown } = mouseState;
      if (didSetLoopOnMouseDown) {
        const percent = e.clientX / width;
        updateLocators('loop', getUpdatedLoopLocators(lastMouseDownPercent, Math.max(percent, 0)));
        setMouseState(prev => ({
          ...prev,
          isMouseDown: false,
          didSetLoopOnMouseDown: false,
        }));
      }

      draw();
    },
    [mouseState, width],
  );

  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const { zoom } = useTrack.getState();
      const { deltaY, clientX } = e;
      zoom({
        focalPoint: clientX / width,
        factor: prevFactor => Math.max(1, prevFactor - deltaY * prevFactor * 0.01),
      }).draw();
    },
    [width],
  );

  useLayoutEffect(() => {
    canvas?.addEventListener('wheel', onWheel, true);
    return () => canvas?.removeEventListener('wheel', onWheel, true);
  }, [canvas, onWheel]);

  return {
    onMouseDown,
    onMouseLeave,
    onMouseMove,
    onMouseUp,
  };
};
