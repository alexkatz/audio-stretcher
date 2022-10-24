export type Key = 'Space' | 'ShiftLeft' | 'ShiftRight' | 'KeyZ' | 'Escape' | 'Enter';

export type CodeKey<T = any> = T & { code: Key };
