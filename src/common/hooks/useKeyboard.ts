import { useEffect } from 'react';

type Key = 'Space' | 'ShiftLeft' | 'ShiftRight' | 'KeyZ' | 'Escape';

type UseKeyboardEvent = globalThis.KeyboardEvent & { code: Key };

export const useKeydown = (callback: (e: UseKeyboardEvent) => void, deps: readonly any[]) => {
  useEffect(() => {
    window.addEventListener('keydown', callback as any);
    return () => window.removeEventListener('keydown', callback as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
