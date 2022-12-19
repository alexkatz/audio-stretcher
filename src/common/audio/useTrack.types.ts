import { AudioSession } from '../db';
import { Locators } from '../types/Locators';

export type InitializeParams = Pick<AudioSession, 'arrayBuffer' | 'source' | 'displayName'>;

export type TrackStatus = 'uninitialized' | 'initialized' | 'initializing' | 'failed-to-initialize';

export type LocatorType = 'prevLoop' | 'loop' | 'hover' | 'zoom';

export type TrackLocators = { [K in LocatorType as `${K}Locators`]?: Locators };

export type UpdateLocatorOptions = {
  restartPlayback?: boolean;
};

export type ZoomResetOptions = { reset: true };
export type ZoomFactorOptions = { factor: number | ((prev: number) => number); focus: number };
export type ZoomLocatorOptions = (Locators & Never<ZoomResetOptions>) | (ZoomResetOptions & Never<Locators>);

export type ZoomOptions =
  | (ZoomLocatorOptions & Never<ZoomFactorOptions>)
  | (ZoomFactorOptions & Never<ZoomLocatorOptions>);

export type ZoomState = {
  factor: number;
  prevFactor: number;
  focus: number | undefined;
  prevStart: number;
};

export type Track = {
  status: TrackStatus;
  isPlaying: boolean;

  displayName?: string;
  samples: Float32Array;
  source?: string;
  audioBuffer?: AudioBuffer;
  startedPlayingAt?: number;
  audioContext?: AudioContext;

  isMono: boolean;

  gain: number;
  pan: number;

  canvasDomSize: { width?: number; height?: number };

  zoomState: ZoomState;

  initAudio(params: InitializeParams): Promise<TrackStatus>;
  initCanvas(canvas: HTMLCanvasElement): void;

  play(): void;
  pause(): Pick<Track, 'draw'>;
  draw(): void;
  zoom(options: ZoomOptions): Pick<Track, 'draw' | 'updateLocators'>;
  clear(): void;

  updateLocators(
    type?: LocatorType,
    locators?: Locators | ((currentLocators?: Locators) => Locators | undefined),
    options?: UpdateLocatorOptions,
  ): Pick<Track, 'draw'>;

  setGain(gain: number): void;
  setPan(pan: number): void;

  getNormalized<T extends number | Locators>(local: T): T;
  getLocalized<T extends number | Locators>(local: T): T;
  getLoopTimes(): [number, number];
} & TrackLocators;

type PanChannelGain = {
  leftNode: GainNode;
  rightNode: GainNode;
};

export type PanGain = {
  leftChannel: PanChannelGain;
  rightChannel: PanChannelGain;
};

export type CanvasColors = {
  loop: string;
  cursor: string;
  shadow: string;
};
