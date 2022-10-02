import { useLayoutEffect, useMemo, useRef } from 'react';
import { usePlayer } from '~/audio/usePlayer';
import { assertsIsReady, assertChannelData, findPeak } from './utils';

type Props = {
  className?: string;
  width: number;
  height: number;
};

export const Waveform = ({ width, height, className }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const status = usePlayer(state => state.status);
  const samples = usePlayer(state => state.monoChannelData);

  assertsIsReady(status);
  assertChannelData(samples);

  const [canvasWidth, canvasHeight] = useMemo(() => [width * 4, height * 4], [width, height]);
  const canvasStyle = useMemo(() => ({ width, height }), [width, height]);

  const pixelFactor = useMemo(() => samples.length / canvasWidth, [canvasWidth, samples.length]);
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || !canvas) return;

    const gradient = context.createLinearGradient(0, 0, 0, canvasHeight);
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, 'rgba(247, 4, 69, 0.5)');
    context.fillStyle = gradient;

    const centerY = canvasHeight / 2;

    context.beginPath();
    context.moveTo(0, centerY);

    for (let i = 0; i < canvasWidth * 2; i += 1) {
      const isPositive = i < canvasWidth;
      const x = isPositive ? i : canvasWidth * 2 - i;
      const peak = findPeak(samples, Math.floor(x * pixelFactor), Math.floor((x + 1) * pixelFactor), isPositive);
      context.lineTo(x, centerY - centerY * peak);
    }

    context.fill();
  }, [samples, pixelFactor, canvasWidth, canvasHeight]);

  return <canvas width={canvasWidth} height={canvasHeight} ref={canvasRef} style={canvasStyle} className={className} />;
};
