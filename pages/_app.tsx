import Head from 'next/head';
import Router from 'next/router';
import { ToastContainer } from 'react-toastify';
import NProgress from 'nprogress';
import type { AppProps } from 'next/app';
import { Provider, defaultChains } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { providers } from 'ethers';
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

const infuraId = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID as string;
const chains = defaultChains;

type Config = { chainId?: number };

const connectors = () => {
  return [new InjectedConnector({ chains })];
};

const provider = ({ chainId }: Config) => new providers.InfuraProvider(chainId, infuraId);

export default function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <>
      <Head>
        <title>DECK</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ServiceWorker>
        <Provider autoConnect connectors={connectors} provider={provider}>
          <ProvideAuth>
            {router.pathname.startsWith('/app/') ? (
              <AppLayout>
                <Component {...pageProps} />
              </AppLayout>
            ) : (
              <Component {...pageProps} />
            )}
          </ProvideAuth>
        </Provider>
      </ServiceWorker>
      <ToastContainer position="top-center" hideProgressBar newestOnTop={true} limit={5} theme="colored" />
    </>
  );
}
