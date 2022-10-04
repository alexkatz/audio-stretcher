import { usePlayer } from '~/audio/usePlayer';

const CURSOR_WIDTH = 1;

export class TrackPainter {
  private peaks: Map<number, number> = new Map();
  private averages: Map<number, number> = new Map();
  private samples: Float32Array;
  private pixelFactor: number;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  offscreenCanvas = document.createElement('canvas');
  offscreenCanvasReady = false;

  constructor(canvas: HTMLCanvasElement, samples: Float32Array) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d')!;
    this.offscreenCanvas.width = canvas.width;
    this.offscreenCanvas.height = canvas.height;

    this.pixelFactor = samples.length / canvas.width;
    this.samples = samples;
  }

  private findLocalPeak(x: number, isPositive: boolean) {
    const key = isPositive ? x : -x;

    if (this.peaks.has(key)) {
      return this.peaks.get(key)!;
    }

    const from = Math.floor(x * this.pixelFactor);
    const to = Math.floor((x + 1) * this.pixelFactor);

    let peak = 0;
    for (let i = from; i < to; i += 1) {
      if (i >= this.samples.length) break;
      const sample = this.samples[i]!;
      if ((isPositive && sample > peak) || (!isPositive && sample < peak)) {
        peak = sample;
      }
    }

    this.peaks.set(key, peak);

    return peak;
  }

  private findAverage(x: number, isPositive: boolean) {
    const key = isPositive ? x : -x;

    if (this.averages.has(key)) {
      return this.averages.get(key)!;
    }

    const from = Math.floor(x * this.pixelFactor);
    const to = Math.floor((x + 1) * this.pixelFactor);

    let sum = 0;
    let includedCount = 0;

    for (let i = from; i < to; i += 1) {
      const sample = this.samples[i]!;
      if ((isPositive && sample > 0) || (!isPositive && sample < 0)) {
        sum += sample;
        includedCount += 1;
      }
    }

    const average = sum / includedCount;

    this.averages.set(key, average);

    return average;
  }

  paint() {
    const { audioBuffer, startedPlayingAt, audioContext, hoverLocators, loopLocators } = usePlayer.getState();

    if (!audioBuffer || !audioContext) return;

    // draw waveform

    if (!this.offscreenCanvasReady) {
      const helperContext = this.offscreenCanvas.getContext('2d');
      if (!helperContext) return;

      helperContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const gradient = helperContext.createLinearGradient(0, 0, 0, this.canvas.height);
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(1, 'rgba(4, 247, 105, 0.5)');
      helperContext.fillStyle = gradient;

      helperContext.shadowColor = 'rgba(216, 184, 193, 0.5)';
      helperContext.shadowBlur = 10;

      const centerY = this.canvas.height / 2;

      helperContext.beginPath();
      helperContext.moveTo(0, centerY);

      for (let i = 0; i < this.canvas.width * 2; i += 1) {
        const isPositive = i < this.canvas.width;
        const x = isPositive ? i : this.canvas.width * 2 - i;
        const peak = this.findLocalPeak(x, isPositive);
        helperContext.lineTo(x, centerY - centerY * peak);
      }

      helperContext.fill();
      this.offscreenCanvasReady = true;
    }

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(this.offscreenCanvas, 0, 0);

    // draw playback progress

    if (startedPlayingAt != null) {
      const timePlaying = audioContext.currentTime - startedPlayingAt;
      const loopStart = audioBuffer.duration * (loopLocators?.startPercent ?? 0);
      const loopEnd = loopLocators?.endPercent == null ? undefined : audioBuffer.duration * loopLocators.endPercent;
      const loopDuration = loopEnd == null ? audioBuffer.duration : loopEnd - loopStart;
      const cursorPercent = ((timePlaying % loopDuration) + loopStart) / audioBuffer.duration;
      const x = cursorPercent * this.canvas.width;
      this.context.save();
      this.context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.context.fillRect(x, 0, CURSOR_WIDTH, this.canvas.height);
      this.context.restore();
    }

    // draw hover locators

    if (hoverLocators) {
      const { startPercent } = hoverLocators;
      const x = startPercent * this.canvas.width;
      this.context.save();
      this.context.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.context.fillRect(x, 0, CURSOR_WIDTH, this.canvas.height);
      this.context.restore();
    }

    // draw loop locators

    if (loopLocators) {
      const { startPercent, endPercent } = loopLocators;
      const startX = startPercent * this.canvas.width;
      const endX = endPercent == null ? undefined : endPercent * this.canvas.width;
      this.context.save();
      this.context.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.context.fillRect(startX, 0, endX ? endX - startX : CURSOR_WIDTH, this.canvas.height);
      this.context.restore();
    }
  }
}
