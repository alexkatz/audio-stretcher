import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { motion, TargetAndTransition } from 'framer-motion';
import { useRouter } from 'next/router';
import { MouseEvent, useCallback, useMemo } from 'react';
import { IoMdRemove } from 'react-icons/io';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '~/audio/useStore';
import { DB_QUERY_KEY } from 'src/common/dbQueryKey';
import { AudioSessionSummary, db } from 'src/common/db';

dayjs.extend(localizedFormat);

const REMOVE_SIZE = 60;

type RowVariants = {
  hover?: TargetAndTransition;
  removeHover?: TargetAndTransition;
  removeTap?: TargetAndTransition;
  rest?: TargetAndTransition;
  tap?: TargetAndTransition;
};

const textContainerVariants: RowVariants = {
  hover: {
    scale: 1.03,
  },
  tap: {
    scale: 1.02,
  },
};

const textVariants: RowVariants = {
  hover: {
    opacity: 1,
  },
  rest: {
    opacity: 0.6,
  },
};

const removeContainerVariants: RowVariants = {
  hover: {
    right: 0,
    opacity: 0.5,
  },
  rest: {
    right: -REMOVE_SIZE,
    opacity: 0,
  },
};

const removeVariants: RowVariants = {
  removeHover: {
    scale: 1.1,
  },
  removeTap: {
    scale: 1.05,
  },
};

type Props = {
  summary: AudioSessionSummary;
};

export const RecentSession = ({ summary }: Props) => {
  const router = useRouter();
  const lastOpenedAt = useMemo(() => dayjs(summary.lastOpenedAt).format('LLLL'), [summary.lastOpenedAt]);

  const cancelDownload = useStore(store => store.cancelGetSessionFromYoutube);

  const queryClient = useQueryClient();

  const mutation = useMutation([DB_QUERY_KEY.SESSION_SUMMARIES], async (source: string) => {
    await db.removeSession(source);
  });

  const handleOnClick = useCallback(() => {
    cancelDownload();
    router.push('/analyze', `/analyze?source=${encodeURIComponent(summary.source)}`);
  }, [cancelDownload, router, summary.source]);

  const handleOnClickRemove = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      mutation.mutate(summary.source, {
        onSuccess() {
          queryClient.invalidateQueries([DB_QUERY_KEY.SESSION_SUMMARIES]);
        },
      });
    },
    [mutation, queryClient, summary.source],
  );

  return (
    <motion.div
      whileHover='hover'
      initial='rest'
      whileTap='tap'
      className='relative flex h-full flex-col items-center justify-center text-2xl text-slate-500 hover:cursor-pointer'
      onClick={handleOnClick}
    >
      <motion.div
        variants={textContainerVariants}
        className='relative flex h-full w-full flex-col items-center justify-center'
      >
        <motion.div className='max-w-3/4 truncate text-ellipsis font-light' variants={textVariants}>
          {summary.displayName}
        </motion.div>
        <motion.div className='text-xs text-slate-500' variants={textVariants}>
          {lastOpenedAt}
        </motion.div>
      </motion.div>

      <motion.span className='absolute' variants={removeContainerVariants}>
        <motion.button
          whileHover='removeHover'
          whileTap='removeTap'
          className='flex h-full w-full items-center justify-center rounded'
          variants={removeVariants}
          style={{ width: REMOVE_SIZE }}
          onClick={handleOnClickRemove}
        >
          <IoMdRemove size={REMOVE_SIZE} />
        </motion.button>
      </motion.span>
    </motion.div>
  );
};
