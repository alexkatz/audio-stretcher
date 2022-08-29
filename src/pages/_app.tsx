// src/pages/_app.tsx
import '../styles/globals.css';
import type { AppType } from 'next/dist/shared/lib/utils';
import { trpc } from '../utils/trpc';
import Head from 'next/head';

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>audio-stretcher</title>
        <meta name='description' content='Playback audio' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <Component {...pageProps} />
    </>
  );
};

export default trpc.withTRPC(MyApp);
