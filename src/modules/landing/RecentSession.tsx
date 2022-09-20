import { AudioSession } from 'src/common/db';

type Props = {
  session: AudioSession;
};

export const RecentSession = ({ session }: Props) => {
  return (
    <div className='flex flex-row justify-evenly'>
      <div>name: {session.displayName}</div>
      <div>source: {session.source}</div>
    </div>
  );
};
