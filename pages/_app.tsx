import Head from 'next/head';
import Router from 'next/router';
import { ToastContainer } from 'react-toastify';
import NProgress from 'nprogress';
import type { AppProps } from 'next/app';
import { WagmiConfig, configureChains, createConfig } from 'wagmi';
import { mainnet, goerli, sepolia } from 'wagmi/chains';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { infuraProvider } from 'wagmi/providers/infura';
import { publicProvider } from 'wagmi/providers/public';
import { ProvideAuth } from 'utils/useAuth';
import AppLayout from 'components/AppLayout';
import ServiceWorker from 'components/ServiceWorker';
import 'styles/globals.css';
import 'styles/nprogress.css';
import 'styles/prism-theme.css';
import 'styles/remark-callouts.css';
import 'react-toastify/dist/ReactToastify.css';

Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

const infuraId = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID as string;
const { chains, publicClient } = configureChains(
  [mainnet, goerli, sepolia],
  [infuraProvider({ apiKey: infuraId }), publicProvider()],
);

const config = createConfig({
  autoConnect: false,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string,
      },
    }),
  ],
  publicClient,
});

export default function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <>
      <Head>
        <title>Dunlin</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>

      <ServiceWorker>
        <WagmiConfig config={config}>
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
      <ToastContainer position="bottom-right" hideProgressBar newestOnTop={true} limit={5} theme="colored" />
    </>
  );
}
