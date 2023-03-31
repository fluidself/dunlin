import { withIronSessionSsr } from 'iron-session/next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ironOptions } from 'constants/iron-session';
import { useAuth } from 'utils/useAuth';
import useLitProtocol from 'utils/useLitProtocol';
import { verifyDeckAccess } from 'utils/accessControl';
import Portal from 'components/Portal';
import DunlinIcon from 'components/DunlinIcon';
import { EthereumIcon } from 'components/onboarding/EthereumIcon';
import ConnectModal from 'components/onboarding/ConnectModal';
import ErrorPage from 'components/ErrorPage';
import dunlinDemo from 'public/dunlin-demo.png';

type Props = {
  deckId: string;
};

export default function JoinDeck({ deckId }: Props) {
  const { user } = useAuth();
  const { isReady, isError } = useLitProtocol();
  const router = useRouter();
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!user) return;
      const success = await verifyDeckAccess(deckId, user, localStorage.getItem('dbToken') ?? '');
      if (success) {
        toast.success('Access to workspace is granted');
        router.push(`/app/${deckId}`);
      } else {
        router.push('/');
      }
    };

    if (user && isReady) {
      verifyAccess();
    }
  }, [user, deckId, router, isReady]);

  if (isError) {
    return <ErrorPage />;
  }

  return (
    <>
      <div id="app-container" className="h-full min-h-screen bg-gray-900 text-gray-100">
        <header className="flex justify-between items-center px-2 py-2 md:px-10 md:py-6">
          <div className="flex items-center">
            <DunlinIcon />
            <h2 className="ml-2">Dunlin</h2>
          </div>
          <Link href="/docs" className="text-gray-300 hover:text-gray-100" aria-label="Documentation">
            Docs
          </Link>
        </header>
        <main className="container flex flex-col overflow-y-hidden mt-16 md:mt-20 pb-8">
          <div className="mx-auto mb-12 px-4 md:px-0 max-w-4xl">
            <h1 className="text-4xl md:pl-0 md:text-7xl font-heading">
              Knowledge management
              <br />
              for <span className="heading-border-white">crypto natives.</span>
            </h1>
            <div className="mt-6 md:mt-12 md:text-xl mx-auto text-center">
              Dunlin is a note-taking app that helps individuals and communities capture, organize, make sense of, and
              share complex information. Encrypted by default and fully collaborative workspaces.
            </div>
          </div>
          <button
            className={`flex items-center justify-center px-6 py-2 rounded uppercase md:w-80 mx-auto border ${
              !user
                ? 'bg-white text-gray-900 hover:text-gray-100 hover:bg-inherit hover:border-gray-100'
                : 'bg-gray-800 text-gray-600 hover:bg-gray-800 cursor-not-allowed'
            }`}
            disabled={!!user}
            onClick={() => setConnectModalOpen(true)}
          >
            <EthereumIcon />
            <span>Sign-in with Ethereum</span>
          </button>

          <Image src={dunlinDemo} alt="Dunlin editor" priority className="mt-24 border border-gray-600 rounded-lg" />
        </main>
      </div>
      {connectModalOpen ? (
        <Portal>
          <ConnectModal onClose={() => setConnectModalOpen(false)} />
        </Portal>
      ) : null}
    </>
  );
}

export const getServerSideProps = withIronSessionSsr(async function ({ params }) {
  const UUID_REGEX = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;

  if (typeof params?.deckId !== 'string' || !params.deckId.match(UUID_REGEX)) {
    return { redirect: { destination: '/', permanent: false } };
  }

  return { props: { deckId: params.deckId } };
}, ironOptions);
