export const getArrayBufferFromAudioFile = (file: File): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onerror = () => reject(new Error('Error reading file'));
    fileReader.onloadend = () => {
      if (typeof fileReader.result === 'object' && fileReader.result != null) {
        resolve(fileReader.result);
      }

      reject(new Error('Error reading file'));
    };

    fileReader.readAsArrayBuffer(file);
  });
