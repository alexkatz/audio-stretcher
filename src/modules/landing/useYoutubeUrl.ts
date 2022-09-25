import { useCallback, useMemo, useState } from 'react';
import { getIsValidYoutubeUrl } from '~/utils/validateYoutubeUrl';

// this.setState({ audioFetchProgress: 0 }, async () => {
//   const result = await Constant.GET_YOUTUBE_AUDIO(url);
//   if (result) {
//     const reader = result.stream.getReader();
//     const readChunksRecursively = async (arrays: Uint8Array[], length: number) => {
//       const readResult = await reader.read();
//       if (readResult.done) {
//         const array = new Uint8Array(length);
//         arrays.reduce((length, arr) => {
//           array.set(arr, length);
//           return length += arr.length;
//         }, 0);
//         this.setState({ audioFetchProgress: 1 }, () => this.player.setAudioFromBuffer(array.buffer));
//       } else {
//         const array = readResult.value;
//         arrays.push(array);
//         length += array.length;
//         const audioFetchProgress = length / result.totalLength;
//         this.setState({ audioFetchProgress }, () => readChunksRecursively(arrays, length));
//       }
//     };

//     readChunksRecursively([], 0);
//   }
// });

export const useYoutubeUrl = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isGettingAudio, setIsGettingAudio] = useState(false);
  const isValidYoutubeUrl = useMemo(() => getIsValidYoutubeUrl(youtubeUrl), [youtubeUrl]);

  const handleGetAudioFromUrl = useCallback(async () => {
    if (!isValidYoutubeUrl) return;
    setIsGettingAudio(true);

    const res = await fetch(`/api/audio?url=${encodeURIComponent(youtubeUrl)}`);
    const stream = res.body;
    const totalLength = Number(res.headers.get('Content-Length'));
  }, [youtubeUrl]);

  return {
    youtubeUrl,
    setYoutubeUrl,
    isValidYoutubeUrl,
    handleGetAudioFromUrl,
  } as const;
};
