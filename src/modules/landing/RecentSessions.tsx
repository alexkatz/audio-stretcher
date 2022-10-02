import { forwardRef, Ref, useEffect, useMemo, useRef } from 'react';
import { c } from '~/utils/classnames';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteQuery } from '@tanstack/react-query';
import { db } from 'src/common/db';
import { RecentSession } from './RecentSession';
import { DB_QUERY_KEY } from 'src/common/DbQueryKey';
import { motion } from 'framer-motion';
import { mergeRefs } from '~/utils/mergeRefs';

const PAGE_SIZE = 10;

type Props = {
  className?: string;
};

export const RecentSessions = motion(
  forwardRef(({ className }: Props, ref: Ref<HTMLDivElement>) => {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
      queryKey: [DB_QUERY_KEY.SESSION_SUMMARIES],
      getNextPageParam: lastPage => lastPage.nextCursor,
      queryFn: async ({ pageParam }: { pageParam?: string }) => await db.getSessionSummaries(PAGE_SIZE, pageParam),
    });

    const parentRef = useRef<HTMLDivElement>(null);

    const firstPage = data?.pages[0];
    const total = useMemo(() => firstPage?.total ?? PAGE_SIZE, [firstPage?.total]);
    const summaries = useMemo(() => data?.pages.flatMap(page => page.summaries) ?? [], [data]);

    const virtualizer = useVirtualizer({
      count: total,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 60,
      overscan: 5,
      getItemKey: index => summaries[index]?.source ?? index,
    });

    const virtualItems = virtualizer.getVirtualItems();
    const totalSize = virtualizer.getTotalSize();

    useEffect(() => {
      const lastItem = virtualItems.at(-1);

      if (lastItem && lastItem.index > summaries.length - 1 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage, summaries.length, virtualItems]);

    return (
      <div className={c('overflow-y-scroll', className)} ref={mergeRefs(parentRef, ref)}>
        <div className='relative w-full' style={{ height: totalSize }}>
          {virtualItems.map(({ key, size, start, index }) => {
            const summary = summaries[index];
            return !summary ? null : (
              <div
                key={key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: size,
                  transform: `translateY(${start}px)`,
                }}
              >
                <RecentSession summary={summary} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }),
);
