let audioContext: AudioContext;

export const getAudioContext = () => {
  if (typeof window === 'undefined' || window.AudioContext == null) {
    throw new Error('AudioContext is not supported');
  }

  return audioContext ?? (audioContext = new window.AudioContext());
};
