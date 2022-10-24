import { useEffect } from 'react';
import { CodeKey } from './CodeKey';

type UseKeyboardEvent = CodeKey<globalThis.KeyboardEvent>;

export const useKeydown = (callback: (e: UseKeyboardEvent) => void, deps: readonly any[]) => {
  useEffect(() => {
    window.addEventListener('keydown', callback as any);
    return () => window.removeEventListener('keydown', callback as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
