import { withIronSessionSsr } from 'iron-session/next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import LitJsSdk from 'lit-js-sdk';
import { toast } from 'react-toastify';
import { ironOptions } from 'constants/iron-session';
import { useAuth } from 'utils/useAuth';
import useIsMounted from 'utils/useIsMounted';
import { verifyDeckAccess } from 'utils/accessControl';
import { EthereumIcon } from 'components/EthereumIcon';
import DunlinIcon from 'components/DunlinIcon';
import Button from 'components/Button';
import dunlinDemo from 'public/dunlin-demo.png';

type Props = {
  deckId: string;
};

export default function JoinDeck({ deckId }: Props) {
  const { user, signIn } = useAuth();
  const [litReady, setLitReady] = useState(false);
  const isMounted = useIsMounted();
  const router = useRouter();

  const initLit = async () => {
    const client = new LitJsSdk.LitNodeClient({ alertWhenUnauthorized: false, debug: false });
    await client.connect();
    window.litNodeClient = client;
    setLitReady(true);
  };

  const verifyAccess = useCallback(async () => {
    if (!user) return;
    const success = await verifyDeckAccess(deckId, user);

    if (success) {
      toast.success('Access to workspace is granted');
      router.push(`/app/${deckId}`);
    } else {
      router.push(`/`);
    }
  }, [deckId, router, user]);

  useEffect(() => {
    if (isMounted() && !litReady) {
      initLit();
    }
    if (user && litReady) {
      verifyAccess();
    }
  }, [isMounted, litReady, user, verifyAccess]);

  return (
    <div id="app-container" className="h-screen">
      <header className="flex justify-between items-center px-2 py-2 md:px-10 md:py-6">
        <div className="flex items-center">
          <DunlinIcon />
          <h2 className="ml-2">Dunlin</h2>
        </div>
        <Link href="/docs" className="focus:outline-none text-gray-300 hover:text-gray-100" aria-label="Documentation">
          Docs
        </Link>
      </header>
      <main className="container flex flex-col overflow-y-hidden mt-16 md:mt-20 pb-8">
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <h1 className="text-3xl md:text-7xl font-bold tracking-tighter leading-[3.5rem] md:!leading-[6rem] bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
            Organized knowledge.
          </h1>
          <div className="mt-6 md:mt-12 md:text-xl text-center">
            Dunlin is a note-taking app that helps individuals and communities capture, organize, make sense of, and
            share complex information.
          </div>
        </div>

        <Button className="md:w-80 mx-auto" primary onClick={signIn}>
          <EthereumIcon />
          <span>Sign-in with Ethereum</span>
        </Button>

        <Image src={dunlinDemo} alt="Dunlin editor" priority className="mt-24 border border-gray-600 rounded-lg" />
      </main>
    </div>
  );
}

export const getServerSideProps = withIronSessionSsr(async function ({ params }) {
  const UUID_REGEX = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;

  if (typeof params?.deckId !== 'string' || !params.deckId.match(UUID_REGEX)) {
    return { redirect: { destination: '/', permanent: false } };
  }

  return { props: { deckId: params.deckId } };
}, ironOptions);
