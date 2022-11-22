import create from 'zustand';
import { Locators } from '../types/Locators';
import type { Track, TrackLocators, TrackStatus } from './useTrack.types';

// TODO: https://github.com/olvb/phaze/

const DEFAULT_LOCATORS: Locators = { start: 0 };

const CURSOR_WIDTH = 2;
const RES_FACTOR = 1;

const DEFAULT_VALUES: Complete<StripFunctions<Track>> = {
  displayName: '',
  isPlaying: false,
  status: 'uninitialized',

  loopLocators: undefined,
  prevLoopLocators: undefined,
  hoverLocators: undefined,
  zoomLocators: undefined,

  startedPlayingAt: undefined,

  gain: 0.75,

  source: undefined,
  samples: new Float32Array(),

  audioBuffer: undefined,
  audioContext: undefined,

  canvasDomSize: {},

  zoomState: {
    factor: 1,
    prevFactor: 1,
    prevStart: 0,
    focus: undefined,
  },
};

export const useTrack = create<Track>((set, get) => {
  const peaks = new Map<number, number>();

  let bufferSource: AudioBufferSourceNode | undefined;
  let gainNode!: GainNode;

  let canvas!: HTMLCanvasElement;
  let context!: CanvasRenderingContext2D;
  let offscreenCanvas!: HTMLCanvasElement;
  let offscreenContext!: CanvasRenderingContext2D;
  let offscreenCanvasReady = false;

  let samplesPerPixel!: number;

  let observer!: ResizeObserver;

  const getLoopTimes = (): [number, number] => {
    const { audioBuffer, loopLocators, zoomLocators = DEFAULT_LOCATORS } = get();
    if (!audioBuffer) throw new Error('audioBuffer is not defined');

    const loopStartTime = (loopLocators?.start ?? zoomLocators.start) * audioBuffer.duration;
    const loopEndTime = (loopLocators?.end ?? zoomLocators.end ?? 1) * audioBuffer.duration;

    return [loopStartTime, loopEndTime];
  };

  const getNormalized = <T extends number | Locators>(local: T): T => {
    const { zoomLocators = DEFAULT_LOCATORS, zoomState } = get();

    if (zoomState.factor === 1) return local;

    if (typeof local === 'number') {
      return (zoomLocators.start + local * zoomState.factor) as T;
    }

    const { start, end } = local;

    return {
      start: zoomLocators.start + start * zoomState.factor,
      end: end != null ? zoomLocators.start + end * zoomState.factor : undefined,
    } as T;
  };

  const getLocalized = <T extends number | Locators>(normalized: T): T => {
    const { zoomLocators = DEFAULT_LOCATORS, zoomState } = get();

    if (zoomState.factor === 1) return normalized;

    if (typeof normalized === 'number') {
      return ((normalized - zoomLocators.start) / zoomState.factor) as T;
    }

    const { start, end } = normalized;

    return {
      start: (start - zoomLocators.start) / zoomState.factor,
      end: end != null ? (end - zoomLocators.start) / zoomState.factor : undefined,
    } as T;
  };

  const findLocalPeak = (x: number, isPositive: boolean, offset: number) => {
    const key = isPositive ? x : -x;

    if (peaks.has(key)) {
      return peaks.get(key)!;
    }

    const { samples } = get();
    const bucketStart = Math.ceil(x * samplesPerPixel + offset);
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
      const { samples, zoomLocators = DEFAULT_LOCATORS } = get();

      offscreenContext.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = offscreenContext.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(1, 'purple');
      offscreenContext.fillStyle = gradient;

      offscreenContext.shadowColor = 'rgba(216, 184, 193, 0.5)';
      offscreenContext.shadowBlur = 10;

      const centerY = canvas.height / 2;

      offscreenContext.beginPath();
      offscreenContext.moveTo(0, centerY);

      const offset = samples.length * zoomLocators.start;

      for (let i = 0; i < canvas.width * 2; i += 1) {
        const isPositive = i < canvas.width;
        const x = isPositive ? i : canvas.width * 2 - i;
        const peak = findLocalPeak(x, isPositive, offset);
        offscreenContext.lineTo(x, centerY - centerY * peak);
      }

      offscreenContext.fill();
      offscreenCanvasReady = true;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(offscreenCanvas, 0, 0);
  };

  const drawPlaybackProgress = () => {
    const { startedPlayingAt, audioContext, audioBuffer } = get();
    if (startedPlayingAt == null || audioContext == null || audioBuffer == null) return;

    const [startTime, endTime] = getLoopTimes();
    const loopDuration = endTime - startTime;
    const timePlaying = audioContext.currentTime - startedPlayingAt;
    const cursorTime = (timePlaying % loopDuration) + startTime;
    const cursor = getLocalized(cursorTime / audioBuffer.duration);

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
    const x = getLocalized(start) * canvas.width;

    context.save();
    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.fillRect(x, 0, CURSOR_WIDTH, canvas.height);
    context.restore();
  };

  const drawLoopLocators = () => {
    const { loopLocators } = get();
    if (!loopLocators) return;

    const { start, end } = getLocalized(loopLocators);

    const startX = start * canvas.width;
    const endX = end == null ? undefined : end * canvas.width;

    context.save();
    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.fillRect(startX, 0, endX ? endX - startX : CURSOR_WIDTH, canvas.height);
    context.restore();
  };

  const drawSequence = [drawWaveform, drawPlaybackProgress, drawHoverLocators, drawLoopLocators];

  return {
    ...DEFAULT_VALUES,
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

        const { draw, samples, zoomState } = get();

        if (width && height) {
          canvas.width = width * RES_FACTOR;
          canvas.height = height * RES_FACTOR;
          samplesPerPixel = (samples.length * zoomState.factor) / canvas.width;

          offscreenCanvas.width = canvas.width;
          offscreenCanvas.height = canvas.height;
          offscreenCanvasReady = false;

          peaks.clear();

          set({ canvasDomSize: { width, height } });
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

      const [startTime, endTime] = getLoopTimes();

      bufferSource = audioContext.createBufferSource();

      bufferSource.loop = true;
      bufferSource.buffer = audioBuffer;
      bufferSource.loopStart = startTime;
      bufferSource.loopEnd = endTime;

      bufferSource.connect(gainNode);

      gainNode.connect(audioContext.destination);

      bufferSource.start(0, startTime);

      set({ isPlaying: true, startedPlayingAt: audioContext.currentTime });
    },

    pause() {
      const { isPlaying } = get();
      if (!isPlaying) return get();

      set({ isPlaying: false, startedPlayingAt: undefined });

      bufferSource?.stop();
      bufferSource?.disconnect();
      bufferSource = undefined;

      return get();
    },

    clear() {
      const { pause } = get();
      pause();
      observer?.disconnect();
      set(DEFAULT_VALUES);
    },

    updateLocators(type = 'loop', locators, options = {}) {
      set(state => {
        const key = `${type}Locators` as const;
        const nextLocators = typeof locators === 'function' ? locators(state[key]) : locators;
        const updates: TrackLocators = { [key]: nextLocators == null ? undefined : getNormalized(nextLocators) };

        if (type === 'loop') {
          updates.prevLoopLocators = state.loopLocators;
          if (locators != null) {
            updates.hoverLocators = undefined;
          }
        }

        return updates;
      });

      const { isPlaying, play } = get();
      if (options.restartPlayback && isPlaying && type === 'loop') play();

      return get();
    },

    setGain(gain) {
      gainNode.gain.value = gain;
      set({ gain });
    },

    getNormalized,
    getLocalized,
    getLoopTimes,

    zoom({ factor, focus, start, end = 1, reset }) {
      const { samples, zoomLocators = DEFAULT_LOCATORS, zoomState } = get();
      let z = { ...zoomState };

      peaks.clear();
      offscreenCanvasReady = false;

      if (factor != null && focus != null) {
        if (focus !== z.focus) {
          z.prevFactor = z.factor;
          z.prevStart = zoomLocators.start;
        }

        z.focus = z.focus === 1 ? 1 : focus;
        z.factor = typeof factor === 'function' ? factor(z.factor) : factor;

        let zoomStart = Math.max(0, z.prevStart + (z.prevFactor - z.factor) * z.focus);
        let zoomEnd = z.focus === 1 ? 1 : zoomStart + z.factor;

        if (zoomEnd >= 1) {
          zoomEnd = 1;
          z.focus = zoomStart === 0 && zoomEnd === 1 ? undefined : 1;
          if (zoomStart !== 0) {
            z.factor = zoomEnd - zoomStart;
            zoomStart = Math.max(0, z.prevStart + (z.prevFactor - z.factor));
          }
        }

        set({
          zoomLocators: { start: zoomStart, end: zoomEnd },
          zoomState: z,
        });
      } else if (reset) {
        z = DEFAULT_VALUES.zoomState;
        set({ zoomLocators: undefined, zoomState: z });
      } else {
        const normalizedStart = getNormalized(start);
        const normalizedEnd = getNormalized(end);

        z.prevFactor = z.factor;
        z.factor = normalizedEnd - normalizedStart;
        z.focus = undefined;
        z.prevStart = normalizedStart;

        set({
          zoomLocators: z.factor === 1 ? undefined : { start: normalizedStart, end: normalizedEnd },
          loopLocators: undefined,
          zoomState: z,
        });
      }

      samplesPerPixel = (samples.length * z.factor) / canvas.width;

      return get();
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

        gainNode = audioContext.createGain();

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
    maxAge: 1,
  });

  connection?.init(useTrack.getState());
  useTrack.subscribe(state => {
    connection.send('update', !state.samples ? state : { ...state, samples: state.samples.byteLength }, { maxAge: 3 });
  });
}
