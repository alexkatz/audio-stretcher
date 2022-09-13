import { Player } from './Player';

export const createPlayer = (buffer: ArrayBuffer): Promise<Player> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') reject(new Error('window is undefined'));

    const audioContext = new window.AudioContext();

    audioContext.decodeAudioData(
      buffer,
      (audioBuffer) => {
        const bufferSource = audioContext.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.connect(audioContext.destination);

        return resolve({
          play() {
            bufferSource.start();
          },
          pause() {
            bufferSource.stop();
          },
        });
      },
      () => reject(new Error('Error decoding audio data')),
    );
  });
};
