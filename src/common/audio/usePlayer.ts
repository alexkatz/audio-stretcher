import create from 'zustand';
import { AudioSession } from '../db';
import { playerIsReady } from './playerIsReady';

// TODO: https://github.com/olvb/phaze/

export type InitializeParams = Pick<AudioSession, 'arrayBuffer' | 'source' | 'displayName'>;

export type PlayerStatus = 'paused' | 'playing' | 'initializing' | 'uninitialized' | 'failed-to-initialize';

type Locators = {
  startPercent: number;
  endPercent?: number;
};

export type Player = {
  status: PlayerStatus;

  loopLocators: Locators;
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

  updateLoopLocators(loopLocators: Locators): void;
};

const defaultValues: Complete<StripFunctions<Player>> = {
  displayName: '',
  status: 'uninitialized',
  loopLocators: { startPercent: 0 },
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
      const { status, audioBuffer, audioContext } = get();
      if (!playerIsReady(status) || status === 'playing' || audioBuffer == null || audioContext == null) return;

      bufferSource = audioContext.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(audioContext.destination);
      bufferSource.start();
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

    updateLoopLocators(loopLocators) {
      set({ loopLocators });
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
