import { useParsedQuery } from './useParsedQuery';

export const useParsedSource = () => {
  const { source } = useParsedQuery<{ source?: string }>();
  return !source ? undefined : decodeURIComponent(source);
};
