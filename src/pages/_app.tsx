// src/pages/_app.tsx
import '../styles/globals.css';
import type { AppType } from 'next/dist/shared/lib/utils';
import { trpc } from '../utils/trpc';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useUpdateParsedQuery } from 'src/common/useParsedQuery';

const MyApp: AppType = ({ Component, pageProps }) => {
  const router = useRouter();
  const updateParsedQuery = useUpdateParsedQuery();

  useEffect(() => {
    updateParsedQuery(router.asPath);
  }, [router.asPath, updateParsedQuery]);

  return (
    <>
      <Head>
        <title>audio-stretcher</title>
        <meta name='description' content='Play back audio' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <Component {...pageProps} />
    </>
  );
};

export default trpc.withTRPC(MyApp);
