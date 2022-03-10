import Head from 'next/head';
import Router from 'next/router';
import { ToastContainer } from 'react-toastify';
import NProgress from 'nprogress';
import type { AppProps } from 'next/app';
import { ProvideAuth } from 'utils/useAuth';
import AppLayout from 'components/AppLayout';
import ServiceWorker from 'components/ServiceWorker';
import 'styles/globals.css';
import 'styles/nprogress.css';
import 'react-toastify/dist/ReactToastify.css';
import 'tippy.js/dist/tippy.css';

Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

export default function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <>
      <Head>
        <title>DECK</title>
        <meta name="description" content="Decentralized and Encrypted Collaborative Knowledge" />
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ServiceWorker>
        <ProvideAuth>
          {router.pathname.startsWith('/app') ? (
            <AppLayout>
              <Component {...pageProps} />
            </AppLayout>
          ) : (
            <Component {...pageProps} />
          )}
        </ProvideAuth>
      </ServiceWorker>
      <ToastContainer position="top-center" hideProgressBar newestOnTop={true} theme="colored" />
    </>
  );
}
