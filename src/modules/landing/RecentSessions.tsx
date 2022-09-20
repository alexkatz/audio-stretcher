import { useMemo, useRef } from 'react';
import { c } from '~/utils/classnames';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteQuery } from '@tanstack/react-query';
import { db, DbQueryKey } from 'src/common/db';

const PAGE_SIZE = 4;

type Props = {
  className?: string;
};

export const RecentSessions = ({ className }: Props) => {
  const { data, fetchNextPage } = useInfiniteQuery(
    [DbQueryKey.SessionSummaries],
    async ({ pageParam = undefined }) => await db.getSessionSummaries(PAGE_SIZE, pageParam),
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const parentRef = useRef<HTMLDivElement>(null);

  const firstPage = data?.pages[0];

  const total = useMemo(() => firstPage?.total ?? PAGE_SIZE, [firstPage?.total]);
  const allRows = useMemo(() => data?.pages.flatMap((page) => page.sessions) ?? [], [data]);

  const rowVirtualizer = useVirtualizer({
    count: 30,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
    getItemKey: (index) => index,
  });

  return (
    <div className={c('overflow-y-scroll', className)} ref={parentRef}>
      <div
        className='w-full relative'
        style={{
          height: rowVirtualizer.getTotalSize(),
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            Row {virtualRow.index}
          </div>
        ))}
      </div>
    </div>
  );
};
