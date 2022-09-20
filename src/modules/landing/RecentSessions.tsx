import { useQuery } from '@tanstack/react-query';
import { db, DbQueryKey } from 'src/common/db';
import { c } from '~/utils/classnames';

const PAGE_SIZE = 4;

type Props = {
  className?: string;
};

export const RecentSessions = ({ className }: Props) => {
  // just for testing
  useQuery([DbQueryKey.SessionSummaries], async () => {
    const page1 = await db.getSessionSummaries(PAGE_SIZE);
    const page2 = await db.getSessionSummaries(PAGE_SIZE, page1.nextCursor);
    console.log('page1:', page1);
    console.log('page2:', page2);
    return {
      page1,
      page2,
    };
  });

  return <div className={c('overflow-y-scroll', className)}></div>;
};
