import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import { AudioSessionSummary } from 'src/common/db';

dayjs.extend(localizedFormat);

type Props = {
  summary: AudioSessionSummary;
};

export const RecentSession = ({ summary }: Props) => {
  const router = useRouter();
  const lastOpenedAt = useMemo(() => dayjs(summary.lastOpenedAt).format('LLLL'), [summary.lastOpenedAt]);
  const handleOnClick = useCallback(() => {
    router.push('/analyze', `/analyze?source=${summary.source}`);
  }, [router, summary.source]);

  return (
    <motion.div
      whileHover={{ scale: 1.03, opacity: 1 }}
      whileTap={{ scale: 1.02 }}
      className='flex flex-col items-center justify-center h-full text-2xl text-slate-500 hover:cursor-pointer opacity-60'
      onClick={handleOnClick}
    >
      <div className='font-light'>{summary.displayName}</div>
      <div className='text-xs text-slate-600'>{lastOpenedAt}</div>
    </motion.div>
  );
};
