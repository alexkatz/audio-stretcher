// src/pages/_app.tsx
import '../styles/globals.css';
import type { AppType } from 'next/dist/shared/lib/utils';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useUpdateParsedQuery } from '~/hooks/useParsedQuery';

const queryClient = new QueryClient();

const MyApp: AppType = ({ Component, pageProps }) => {
  const router = useRouter();
  const updateParsedQuery = useUpdateParsedQuery();

  useEffect(() => {
    updateParsedQuery(router.asPath);
  }, [router.asPath, updateParsedQuery]);

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>audio-stretcher</title>
        <meta name='description' content='Play back audio' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <Component {...pageProps} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default MyApp;
