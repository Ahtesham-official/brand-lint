import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>BrandLint — ESLint for Brand Content</title>
        <meta
          name="description"
          content="AI-assisted brand governance platform: cited rulebooks, deterministic & AI checks against guidelines and Fact Vault."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png?v=2" type="image/png" sizes="64x64" />
        <link rel="alternate icon" href="/favicon.ico" type="image/x-icon" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
