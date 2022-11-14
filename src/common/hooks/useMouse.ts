import { MouseEvent, useEffect } from 'react';

export const useMouseMove = (callback: (e: MouseEvent<HTMLElement>) => void, deps: readonly any[]) => {
  useEffect(
    () => {
      window.addEventListener('mousemove', callback as any);
      return () => window.removeEventListener('mousemove', callback as any);
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );
};

export const useMouseUp = (callback: (e: MouseEvent<HTMLElement>) => void, deps: readonly any[]) => {
  useEffect(
    () => {
      window.addEventListener('mouseup', callback as any);
      return () => window.removeEventListener('mouseup', callback as any);
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );
};
