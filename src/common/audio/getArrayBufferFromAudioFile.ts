import { getAudioContext } from './getAudioContext';

export const getAudioBufferFromArrayBuffer = async (arrayBuffer: ArrayBuffer): Promise<AudioBuffer> =>
  new Promise((resolve, reject) => {
    getAudioContext().decodeAudioData(arrayBuffer, resolve, reject);
  });

export const getAudioBufferFromFile = (file: File): Promise<AudioBuffer> =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onerror = () => reject(new Error('Error reading file'));
    fileReader.onloadend = () => {
      if (typeof fileReader.result === 'object' && fileReader.result != null) {
        getAudioContext().decodeAudioData(fileReader.result, resolve, reject);
      } else {
        reject(new Error('Error reading file'));
      }
    };

    fileReader.readAsArrayBuffer(file);
  });
