import Head from 'next/head';
import Router from 'next/router';
import { ToastContainer } from 'react-toastify';
import NProgress from 'nprogress';
import type { AppProps } from 'next/app';
import { WagmiConfig, configureChains, createClient } from 'wagmi';
import { mainnet, goerli } from 'wagmi/chains';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { infuraProvider } from 'wagmi/providers/infura';
import { publicProvider } from 'wagmi/providers/public';
import { ProvideAuth } from 'utils/useAuth';
import AppLayout from 'components/AppLayout';
import ServiceWorker from 'components/ServiceWorker';
import 'styles/globals.css';
import 'styles/nprogress.css';
import 'styles/prism-tomorrow.css';
import 'react-toastify/dist/ReactToastify.css';
import 'tippy.js/dist/tippy.css';

Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

const infuraId = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID as string;
const { chains, provider } = configureChains(
  [mainnet, goerli],
  [infuraProvider({ apiKey: infuraId }), publicProvider()],
);

const client = createClient({
  autoConnect: false,
  connectors: [new InjectedConnector({ chains })],
  provider,
});

export default function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <>
      <Head>
        <title>Dunlin</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>

      <ServiceWorker>
        <WagmiConfig client={client}>
          <ProvideAuth>
            {router.pathname.startsWith('/app/') ? (
              <AppLayout>
                <Component {...pageProps} />
              </AppLayout>
            ) : (
              <Component {...pageProps} />
            )}
          </ProvideAuth>
        </WagmiConfig>
      </ServiceWorker>
      <ToastContainer position="top-center" hideProgressBar newestOnTop={true} limit={5} theme="colored" />
    </>
  );
}
