import { AudioSession } from 'src/common/db';
import create from 'zustand';

// TODO: https://github.com/olvb/phaze/

const CURSOR_WIDTH = 2;
const RES_FACTOR = 2;

export type InitializeParams = Pick<AudioSession, 'arrayBuffer' | 'source' | 'displayName'>;

type TrackStatus = 'uninitialized' | 'initialized' | 'initializing' | 'failed-to-initialize';

export type LocatorType = 'loop' | 'hover' | 'zoom';

export type Locators = {
  start: number;
  end?: number;
};

type TrackLocators = { [K in LocatorType as `${K}Locators`]?: Locators };

type UpdateLocatorOptions = {
  restartPlayback?: boolean;
};

type ZoomLocatorOptions = Locators & { reset?: boolean };
type ZoomFactorOptions = { factor: number; focalPoint: number };
type ZoomOptions = (ZoomLocatorOptions & Never<ZoomFactorOptions>) | (ZoomFactorOptions & Never<ZoomLocatorOptions>);

export type Track = {
  status: TrackStatus;
  isPlaying: boolean;

  displayName?: string;
  samples: Float32Array;
  source?: string;
  audioBuffer?: AudioBuffer;
  startedPlayingAt?: number;
  audioContext?: AudioContext;

  zoomFactor: number;

  canvasDomSize: { width?: number; height?: number };

  initAudio(params: InitializeParams): Promise<TrackStatus>;
  initCanvas(canvas: HTMLCanvasElement): void;

  play(): void;
  pause(): void;
  draw(): void;
  zoom(options: ZoomOptions): void;
  clear(): void;

  updateLocators(
    type?: LocatorType,
    locators?: Locators | ((currentLocators?: Locators) => Locators | undefined),
    options?: UpdateLocatorOptions,
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
  samples: new Float32Array(),
  audioBuffer: undefined,
  startedPlayingAt: undefined,
  audioContext: undefined,
  canvasDomSize: {},
};

export const useTrack = create<Track>((set, get) => {
  const peaks = new Map<number, number>();

  let bufferSource: AudioBufferSourceNode | undefined;

  let canvas!: HTMLCanvasElement;
  let context!: CanvasRenderingContext2D;
  let offscreenCanvas!: HTMLCanvasElement;
  let offscreenContext!: CanvasRenderingContext2D;
  let offscreenCanvasReady = false;

  let samplesPerPixel!: number;

  let observer!: ResizeObserver;

  const getZoomAdjustedPlayTimes = (): [number, number] => {
    const { audioBuffer, loopLocators, zoomLocators, zoomFactor } = get();
    if (!audioBuffer) throw new Error('audioBuffer is not defined');

    const duration = audioBuffer.duration;
    const zoomStartTime = (zoomLocators?.start ?? 0) * duration;
    const loopStartTime = zoomStartTime + ((loopLocators?.start ?? 0) / zoomFactor) * duration;
    const loopEndTime = zoomStartTime + ((loopLocators?.end ?? 1) / zoomFactor) * duration;

    return [loopStartTime, loopEndTime];
  };

  const findLocalPeak = (x: number, isPositive: boolean, zoomOffset: number) => {
    const key = isPositive ? x : -x;

    if (peaks.has(key)) {
      return peaks.get(key)!;
    }

    const { samples } = get();
    const bucketStart = Math.ceil(x * samplesPerPixel + zoomOffset);
    const bucketEnd = Math.ceil(bucketStart + samplesPerPixel);

    let peak = 0;
    for (let i = bucketStart; i < bucketEnd; i += 1) {
      if (i >= samples.length) break;
      const sample = samples[i]!;
      if ((isPositive && sample > peak) || (!isPositive && sample < peak)) {
        peak = sample;
      }
    }

    peaks.set(key, peak);

    return peak;
  };

  const drawWaveform = () => {
    if (!offscreenCanvasReady) {
      const { samples, zoomLocators } = get();

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

      const zoomOffset = samples.length * (zoomLocators?.start ?? 0);

      for (let i = 0; i < canvas.width * 2; i += 1) {
        const isPositive = i < canvas.width;
        const x = isPositive ? i : canvas.width * 2 - i;
        const peak = findLocalPeak(x, isPositive, zoomOffset);
        offscreenContext.lineTo(x, centerY - centerY * peak);
      }

      offscreenContext.fill();
      offscreenCanvasReady = true;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(offscreenCanvas, 0, 0);
  };

  const drawPlaybackProgress = () => {
    const { startedPlayingAt, audioContext, loopLocators, audioBuffer, zoomFactor } = get();
    if (startedPlayingAt == null || audioContext == null || audioBuffer == null) return;

    const [startTime, endTime] = getZoomAdjustedPlayTimes();

    const duration = audioBuffer.duration;
    const zoomDuration = duration / zoomFactor;
    const loopDuration = endTime - startTime;

    const loopLocatorStart = loopLocators?.start ?? 0;
    const loopOffsetTime = loopLocatorStart * zoomDuration;

    const timePlaying = audioContext.currentTime - startedPlayingAt;
    const cursorTime = (timePlaying % loopDuration) + loopOffsetTime;
    const cursor = cursorTime / zoomDuration;

    const x = cursor * canvas.width;

    context.save();
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    context.fillRect(x - CURSOR_WIDTH, 0, CURSOR_WIDTH, canvas.height);
    context.restore();
  };

  const drawHoverLocators = () => {
    const { hoverLocators } = get();
    if (!hoverLocators) return;

    const { start } = hoverLocators;
    const x = start * canvas.width;

    context.save();
    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.fillRect(x, 0, CURSOR_WIDTH, canvas.height);
    context.restore();
  };

  const drawLoopLopcators = () => {
    const { loopLocators } = get();
    if (!loopLocators) return;

    const { start, end } = loopLocators;
    const startX = start * canvas.width;
    const endX = end == null ? undefined : end * canvas.width;

    context.save();
    context.fillStyle = 'rgba(255, 255, 255, 0.4)';
    context.fillRect(startX, 0, endX ? endX - startX : CURSOR_WIDTH, canvas.height);
    context.restore();
  };

  const drawSequence = [drawWaveform, drawPlaybackProgress, drawHoverLocators, drawLoopLopcators];

  return {
    ...defaultValues,
    canvasDomSize: { width: canvas?.clientWidth, height: canvas?.clientHeight },

    initCanvas(c) {
      canvas = c;
      context = canvas.getContext('2d')!;
      offscreenCanvas = document.createElement('canvas');
      offscreenContext = offscreenCanvas.getContext('2d')!;

      observer?.disconnect();
      observer = new ResizeObserver(([entry]) => {
        const width = entry?.contentRect?.width;
        const height = entry?.contentRect?.height;
        const { draw, samples, zoomFactor } = get();

        if (width && height) {
          canvas.width = width * RES_FACTOR;
          canvas.height = height * RES_FACTOR;
          samplesPerPixel = (samples.length * (1 / zoomFactor)) / canvas.width;

          offscreenCanvas.width = canvas.width;
          offscreenCanvas.height = canvas.height;
          offscreenCanvasReady = false;

          peaks.clear();

          set({ canvasDomSize: { width: width, height: height } });
          draw();
        }
      });

      observer.observe(canvas);
    },

    draw() {
      drawSequence.forEach(draw => draw());
    },

    play() {
      const { isPlaying, audioBuffer, audioContext } = get();
      if (audioBuffer == null || audioContext == null) return;

      if (isPlaying) {
        bufferSource?.stop();
        bufferSource?.disconnect();
      }

      const [startTime, endTime] = getZoomAdjustedPlayTimes();
      bufferSource = audioContext.createBufferSource();
      bufferSource.loop = true;
      bufferSource.buffer = audioBuffer;
      bufferSource.loopStart = startTime;
      bufferSource.loopEnd = endTime;
      bufferSource.connect(audioContext.destination);
      bufferSource.start(0, startTime);

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
      observer?.disconnect();
      set(defaultValues);
    },

    updateLocators(type = 'loop', locators, options = {}) {
      set(state => {
        const key = `${type}Locators` as const;
        const nextLocators = typeof locators === 'function' ? locators(state[key]) : locators;
        const updates = { [key]: nextLocators } as Partial<Track>;
        if (type === 'loop' && locators != null) updates.hoverLocators = undefined;
        return updates;
      });

      const { isPlaying, play } = get();
      if (options.restartPlayback && isPlaying && type === 'loop') play();
    },

    zoom({ factor, focalPoint, start, end = 1, reset }) {
      const { samples, zoomFactor, zoomLocators } = get();

      peaks.clear();
      offscreenCanvasReady = false;

      let zoomRatio: number;
      if (factor != null && focalPoint != null) {
        zoomRatio = 1 / factor;
        const zoomDiff = 1 - zoomRatio;
        const start = focalPoint * zoomDiff;
        const end = start + zoomRatio;
        set({ zoomLocators: { start, end }, zoomFactor: factor });
      } else if (reset) {
        zoomRatio = 1;
        set({ zoomLocators: undefined, zoomFactor: 1 });
      } else {
        const trueStart = (zoomLocators?.start ?? 0) + start / zoomFactor;
        const trueEnd = (zoomLocators?.start ?? 0) + end / zoomFactor;
        zoomRatio = trueEnd - trueStart;
        const factor = 1 / zoomRatio;

        set({
          zoomLocators: zoomRatio === 1 ? undefined : { start: trueStart, end: trueEnd },
          zoomFactor: factor,
          loopLocators: undefined,
        });
      }

      samplesPerPixel = (samples.length * zoomRatio) / canvas.width;
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

        const samples =
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
          samples,
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
  console.log('connecting to devtools...');
  const connection = (window as any)?.__REDUX_DEVTOOLS_EXTENSION__?.connect?.({
    name: 'useTrack',
    instanceId: 1,
  });

  connection?.init(useTrack.getState());
  useTrack.subscribe(state => {
    connection.send('update', !state.samples ? state : { ...state, samples: state.samples.byteLength });
  });
}
