import { useEffect } from 'react';

type Key = ' ' | 'shift';

type UseKeyboardEvent = globalThis.KeyboardEvent & { key: Key };

export const useKeydown = (callback: (e: UseKeyboardEvent) => void, deps: readonly any[]) => {
  useEffect(() => {
    window.addEventListener('keydown', callback as any);
    return () => window.removeEventListener('keydown', callback as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

export const useKeyup = (callback: (e: UseKeyboardEvent) => void, deps: readonly any[]) => {
  useEffect(() => {
    window.addEventListener('keyup', callback as any);
    return () => window.removeEventListener('keyup', callback as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
