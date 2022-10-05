import create from 'zustand';
import { usePlayer } from '~/audio/usePlayer';

const CURSOR_WIDTH = 1;
const RES_FACTOR = 2;

export type TrackState = {
  offscreenCanvas: HTMLCanvasElement;
  canvasDomSize: { width?: number; height?: number };
  init(canvas: HTMLCanvasElement, samples: Float32Array): void;
  draw(): void;
  cleanup(): void;
};

export const useTrack = create<TrackState>((set, get) => {
  const peaks = new Map<number, number>();
  const averages = new Map<number, number>();

  let offscreenCanvas!: HTMLCanvasElement;
  let offscreenContext!: CanvasRenderingContext2D;
  let canvas!: HTMLCanvasElement;
  let context!: CanvasRenderingContext2D;
  let samples!: Float32Array;
  let pixelFactor!: number;
  let offscreenCanvasReady = false;
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
      console.log('drawing to offscreen canvas');
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
    const { startedPlayingAt, audioContext, loopLocators, audioBuffer } = usePlayer.getState();
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
    const { hoverLocators } = usePlayer.getState();
    if (!hoverLocators) return;

    const { startPercent } = hoverLocators;
    const x = startPercent * canvas.width;
    context.save();
    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.fillRect(x, 0, CURSOR_WIDTH, canvas.height);
    context.restore();
  };

  const drawLoopLopcators = () => {
    const { loopLocators } = usePlayer.getState();
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
    offscreenCanvas,
    canvasDomSize: { width: canvas?.clientWidth, height: canvas?.clientHeight },

    init(c, s) {
      canvas = c;
      samples = s;
      context = canvas.getContext('2d')!;
      offscreenCanvas = document.createElement('canvas');
      offscreenContext = offscreenCanvas.getContext('2d')!;
      reset(canvas.clientWidth, canvas.clientHeight);

      observer = new ResizeObserver(([entry]) => {
        if (
          entry &&
          entry.contentRect.width !== get().canvasDomSize.width &&
          entry.contentRect.height !== get().canvasDomSize.height
        ) {
          reset(entry.contentRect.width, entry.contentRect.height);
        }
      });
      observer.observe(canvas);
    },

    draw() {
      drawSequence.forEach(draw => draw());
    },

    cleanup() {
      observer.disconnect();
    },
  };
});
