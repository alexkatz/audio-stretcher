const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;

export const getTimeText = (inputSeconds: number) => {
  const hours = Math.floor(inputSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((inputSeconds - hours * SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = inputSeconds - hours * SECONDS_PER_HOUR - minutes * SECONDS_PER_MINUTE;
  const milliseconds = Math.floor((seconds % 1) * 100);
  const secondsFloored = Math.floor(seconds);

  const hh = hours < 10 ? `0${hours}` : hours;
  const mm = minutes < 10 ? `0${minutes}` : minutes;
  const ss = secondsFloored < 10 ? `0${secondsFloored}` : secondsFloored;
  const mmm = milliseconds < 10 ? `0${milliseconds}` : milliseconds;

  return `${hours > 0 ? `${hh}:` : ''}${mm}:${ss}:${mmm}`;
};
