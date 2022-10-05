import create from 'zustand';
import { AudioSession } from '../db';
import { playerIsReady } from './playerIsReady';

// TODO: https://github.com/olvb/phaze/

export type InitializeParams = Pick<AudioSession, 'arrayBuffer' | 'source' | 'displayName'>;

export type PlayerStatus = 'paused' | 'playing' | 'initializing' | 'uninitialized' | 'failed-to-initialize';

export type LocatorType = 'loop' | 'hover';

type Locators = {
  startPercent: number;
  endPercent?: number;
};

type PlayerLocators = { [K in LocatorType as `${K}Locators`]?: Locators };

export type Player = {
  status: PlayerStatus;

  displayName?: string;
  monoChannelData?: Float32Array;
  source?: string;
  audioBuffer?: AudioBuffer;
  startedPlayingAt?: number;
  audioContext?: AudioContext;

  initialize(params: InitializeParams): Promise<void>;

  play(): void;
  pause(): void;
  clear(): void;

  updateLocators(
    type?: LocatorType,
    locators?: Locators | ((currentLocators?: Locators) => Locators | undefined),
  ): void;
} & PlayerLocators;

const defaultValues: Complete<StripFunctions<Player>> = {
  displayName: '',
  status: 'uninitialized',

  loopLocators: undefined,
  hoverLocators: undefined,

  source: undefined,
  monoChannelData: undefined,
  audioBuffer: undefined,
  startedPlayingAt: undefined,
  audioContext: undefined,
};

export const usePlayer = create<Player>((set, get) => {
  let bufferSource: AudioBufferSourceNode | undefined;

  return {
    ...defaultValues,

    play() {
      const { status, audioBuffer, audioContext, loopLocators } = get();
      if (audioBuffer == null || audioContext == null) return;

      if (status === 'playing') {
        bufferSource?.stop();
        bufferSource?.disconnect();
      }

      bufferSource = audioContext.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(audioContext.destination);

      const loopStartTime = loopLocators ? loopLocators.startPercent * audioBuffer.duration : 0;
      if (loopLocators?.endPercent != null) {
        bufferSource.loop = true;
        bufferSource.loopStart = loopStartTime;
        bufferSource.loopEnd = loopLocators.endPercent * audioBuffer.duration;
      }

      bufferSource.start(0, loopStartTime);

      set({ status: 'playing', startedPlayingAt: audioContext.currentTime });
    },
    pause() {
      const { status } = get();
      if (!playerIsReady(status) || status === 'paused') return;

      set({ status: 'paused', startedPlayingAt: undefined });

      bufferSource?.stop();
      bufferSource?.disconnect();
      bufferSource = undefined;
    },

    clear() {
      get().pause();
      set(defaultValues);
    },

    updateLocators(type = 'loop', locators) {
      set(state => {
        const key = `${type}Locators` as const;
        const nextLocators = typeof locators === 'function' ? locators(state[key]) : locators;
        const updates = { [key]: nextLocators } as Partial<Player>;
        if (type === 'loop') updates.hoverLocators = undefined;
        return updates;
      });

      const { status, play } = get();
      if (status === 'playing' && type === 'loop') play();
    },

    async initialize({ arrayBuffer, displayName, source }) {
      try {
        set({ status: 'initializing' });

        if (typeof window === 'undefined' || window.AudioContext == null) {
          throw new Error('AudioContext is not supported');
        }

        const audioContext = new window.AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const leftChannelData = audioBuffer.getChannelData(0);
        const rightChannelData = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : undefined;

        const monoChannelData =
          rightChannelData == null
            ? leftChannelData
            : leftChannelData.map((left, i) => (left + (rightChannelData[i] ?? left)) / 2);

        set({
          status: 'paused',
          displayName,
          source,
          audioBuffer,
          audioContext,
          monoChannelData,
        });
      } catch (error) {
        console.log(error);
        set({ status: 'failed-to-initialize' });
      }
    },
  };
});

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const connection = (window as any)?.__REDUX_DEVTOOLS_EXTENSION__?.connect?.({
    name: 'usePlayer',
  });

  connection?.init(usePlayer.getState());
  usePlayer.subscribe(state => {
    connection.send(
      'update',
      !state.monoChannelData ? state : { ...state, monoChannelData: state.monoChannelData.byteLength },
    );
  });
}
