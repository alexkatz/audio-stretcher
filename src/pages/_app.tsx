// src/pages/_app.tsx
import '../styles/globals.css';
import type { AppType } from 'next/dist/shared/lib/utils';
import { trpc } from '../utils/trpc';
import Head from 'next/head';
import { Provider as JotaiProvider } from 'jotai';

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <JotaiProvider>
      <Head>
        <title>audio-stretcher</title>
        <meta name='description' content='Play back audio' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <Component {...pageProps} />
    </JotaiProvider>
  );
};

export default trpc.withTRPC(MyApp);
