import { AudioSession } from 'src/common/db';
import create from 'zustand';

// TODO: https://github.com/olvb/phaze/

const CURSOR_WIDTH = 4;
const RES_FACTOR = 2;

export type InitializeParams = Pick<AudioSession, 'arrayBuffer' | 'source' | 'displayName'>;

type TrackStatus = 'uninitialized' | 'initialized' | 'initializing' | 'failed-to-initialize';

export type LocatorType = 'loop' | 'hover' | 'zoom';

export type Locators = {
  startPercent: number;
  endPercent?: number;
};

type TrackLocators = { [K in LocatorType as `${K}Locators`]?: Locators };

type ZoomOptions =
  | (Locators & { factor?: never; focalPoint?: never })
  | ({ factor: number; focalPoint: number } & { startPercent?: never; endPercent?: never });

export type Track = {
  status: TrackStatus;
  isPlaying: boolean;

  displayName?: string;
  monoChannelData?: Float32Array;
  source?: string;
  audioBuffer?: AudioBuffer;
  startedPlayingAt?: number;
  audioContext?: AudioContext;

  zoomFactor: number;

  canvasDomSize: { width?: number; height?: number };

  initAudio(params: InitializeParams): Promise<TrackStatus>;
  initCanvas(canvas: HTMLCanvasElement, samples: Float32Array): void;

  play(): void;
  pause(): void;
  draw(): void;
  zoom(options: ZoomOptions): void;
  clear(): void;

  updateLocators(
    type?: LocatorType,
    locators?: Locators | ((currentLocators?: Locators) => Locators | undefined),
  ): void;
} & TrackLocators;

const defaultValues: Complete<StripFunctions<Track>> = {
  displayName: '',
  isPlaying: false,
  status: 'uninitialized',

  loopLocators: undefined,
  hoverLocators: undefined,
  zoomLocators: undefined,
  zoomFactor: 1,

  source: undefined,
  monoChannelData: undefined,
  audioBuffer: undefined,
  startedPlayingAt: undefined,
  audioContext: undefined,
  canvasDomSize: {},
};

export const useTrack = create<Track>((set, get) => {
  const peaks = new Map<number, number>();
  const averages = new Map<number, number>();

  let bufferSource: AudioBufferSourceNode | undefined;

  let offscreenCanvas!: HTMLCanvasElement;
  let offscreenContext!: CanvasRenderingContext2D;
  let offscreenCanvasReady = false;

  let canvas!: HTMLCanvasElement;
  let context!: CanvasRenderingContext2D;

  let samples!: Float32Array;
  let pixelFactor!: number;
  let observer!: ResizeObserver;

  const reset = (domWidth: number, domHeight: number) => {
    canvas.width = domWidth * RES_FACTOR;
    canvas.height = domHeight * RES_FACTOR;
    pixelFactor = samples.length / canvas.width;
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    offscreenCanvasReady = false;

    peaks.clear();
    averages.clear();

    set({ canvasDomSize: { width: domWidth, height: domHeight } });
    get().draw();
  };

  const findLocalPeak = (x: number, isPositive: boolean) => {
    const key = isPositive ? x : -x;

    if (peaks.has(key)) {
      return peaks.get(key)!;
    }

    const from = Math.floor(x * pixelFactor);
    const to = Math.floor((x + 1) * pixelFactor);

    let peak = 0;
    for (let i = from; i < to; i += 1) {
      if (i >= samples.length) break;
      const sample = samples[i]!;
      if ((isPositive && sample > peak) || (!isPositive && sample < peak)) {
        peak = sample;
      }
    }

    peaks.set(key, peak);

    return peak;
  };

  const findLocalAverage = (x: number, isPositive: boolean) => {
    const key = isPositive ? x : -x;

    if (averages.has(key)) {
      return averages.get(key)!;
    }

    const from = Math.floor(x * pixelFactor);
    const to = Math.floor((x + 1) * pixelFactor);

    let sum = 0;
    let includedCount = 0;

    for (let i = from; i < to; i += 1) {
      const sample = samples[i]!;
      if ((isPositive && sample > 0) || (!isPositive && sample < 0)) {
        sum += sample;
        includedCount += 1;
      }
    }

    const average = sum / includedCount;

    averages.set(key, average);

    return average;
  };

  const drawWaveform = () => {
    if (!offscreenCanvasReady) {
      offscreenContext.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = offscreenContext.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(1, 'rgba(4, 247, 105, 0.5)');
      offscreenContext.fillStyle = gradient;

      offscreenContext.shadowColor = 'rgba(216, 184, 193, 0.5)';
      offscreenContext.shadowBlur = 10;

      const centerY = canvas.height / 2;

      offscreenContext.beginPath();
      offscreenContext.moveTo(0, centerY);

      for (let i = 0; i < canvas.width * 2; i += 1) {
        const isPositive = i < canvas.width;
        const x = isPositive ? i : canvas.width * 2 - i;
        const peak = findLocalPeak(x, isPositive);
        offscreenContext.lineTo(x, centerY - centerY * peak);
      }

      offscreenContext.fill();
      offscreenCanvasReady = true;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(offscreenCanvas, 0, 0);
  };

  const drawPlaybackProgress = () => {
    const { startedPlayingAt, audioContext, loopLocators, audioBuffer } = get();
    if (startedPlayingAt == null || audioContext == null || audioBuffer == null) return;

    const timePlaying = audioContext.currentTime - startedPlayingAt;
    const loopStart = audioBuffer.duration * (loopLocators?.startPercent ?? 0);
    const loopEnd = loopLocators?.endPercent == null ? undefined : audioBuffer.duration * loopLocators.endPercent;
    const loopDuration = loopEnd == null ? audioBuffer.duration : loopEnd - loopStart;
    const cursorPercent = ((timePlaying % loopDuration) + loopStart) / audioBuffer.duration;
    const x = cursorPercent * canvas.width;

    context.save();
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    context.fillRect(x, 0, CURSOR_WIDTH, canvas.height);
    context.restore();
  };

  const drawHoverLocators = () => {
    const { hoverLocators } = get();
    if (!hoverLocators) return;

    const { startPercent } = hoverLocators;
    const x = startPercent * canvas.width;

    context.save();
    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.fillRect(x, 0, CURSOR_WIDTH, canvas.height);
    context.restore();
  };

  const drawLoopLopcators = () => {
    const { loopLocators } = get();
    if (!loopLocators) return;

    const { startPercent, endPercent } = loopLocators;
    const startX = startPercent * canvas.width;
    const endX = endPercent == null ? undefined : endPercent * canvas.width;

    context.save();
    context.fillStyle = 'rgba(255, 255, 255, 0.4)';
    context.fillRect(startX, 0, endX ? endX - startX : CURSOR_WIDTH, canvas.height);
    context.restore();
  };

  const drawSequence = [drawWaveform, drawPlaybackProgress, drawHoverLocators, drawLoopLopcators];

  return {
    ...defaultValues,
    canvasDomSize: { width: canvas?.clientWidth, height: canvas?.clientHeight },

    initCanvas(c, s) {
      canvas = c;
      samples = s;
      context = canvas.getContext('2d')!;
      offscreenCanvas = document.createElement('canvas');
      offscreenContext = offscreenCanvas.getContext('2d')!;

      observer?.disconnect();
      observer = new ResizeObserver(([entry]) => {
        const width = entry?.contentRect?.width;
        const height = entry?.contentRect?.height;
        if (width && height) {
          reset(width, height);
        }
      });

      observer.observe(canvas);
    },

    draw() {
      drawSequence.forEach(draw => draw());
    },

    play() {
      const { isPlaying, audioBuffer, audioContext, loopLocators } = get();
      if (audioBuffer == null || audioContext == null) return;
      if (isPlaying) {
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

      set({ isPlaying: true, startedPlayingAt: audioContext.currentTime });
    },

    pause() {
      const { isPlaying } = get();
      if (!isPlaying) return;

      set({ isPlaying: false, startedPlayingAt: undefined });

      bufferSource?.stop();
      bufferSource?.disconnect();
      bufferSource = undefined;
    },

    clear() {
      const { pause } = get();
      pause();
      observer.disconnect();
      set(defaultValues);
    },

    updateLocators(type = 'loop', locators) {
      set(state => {
        const key = `${type}Locators` as const;
        const nextLocators = typeof locators === 'function' ? locators(state[key]) : locators;
        const updates = { [key]: nextLocators } as Partial<Track>;
        if (type === 'loop') updates.hoverLocators = undefined;
        return updates;
      });

      const { isPlaying, play } = get();
      if (isPlaying && type === 'loop') play();
    },

    zoom({ factor, focalPoint, startPercent, endPercent = 1 }) {
      offscreenCanvasReady = false;
      peaks.clear();
      averages.clear();

      let zoomedPercent = 1;
      if (factor && focalPoint) {
        zoomedPercent = 1 / factor;
        const zoomDiff = 1 - zoomedPercent;
        const startPercent = focalPoint * zoomDiff;
        const endPercent = startPercent + zoomedPercent;
        set({ zoomLocators: { startPercent, endPercent }, zoomFactor: factor });
      } else if (startPercent != null) {
        zoomedPercent = endPercent - startPercent;
        const zoomFactor = 1 / zoomedPercent;
        set({ zoomLocators: { startPercent, endPercent }, zoomFactor, loopLocators: undefined });
      }

      pixelFactor = (samples.length * zoomedPercent) / canvas.width;
    },

    async initAudio({ arrayBuffer, displayName, source }) {
      let status: TrackStatus = 'initializing';
      try {
        set({ status });

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

        status = 'initialized';

        set({
          status,
          displayName,
          source,
          audioBuffer,
          audioContext,
          monoChannelData,
        });

        return status;
      } catch (error) {
        console.log(error);
        status = 'failed-to-initialize';
        set({ status });
      } finally {
        return status;
      }
    },
  };
});

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const connection = (window as any)?.__REDUX_DEVTOOLS_EXTENSION__?.connect?.({
    name: 'useTrack',
  });

  connection?.init(useTrack.getState());
  useTrack.subscribe(state => {
    connection.send(
      'update',
      !state.monoChannelData ? state : { ...state, monoChannelData: state.monoChannelData.byteLength },
    );
  });
}
