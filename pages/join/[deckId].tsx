import { withIronSessionSsr } from 'iron-session/next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { IconInfoCircle } from '@tabler/icons';
import { useCallback, useEffect, useState } from 'react';
import LitJsSdk from 'lit-js-sdk';
import { toast } from 'react-toastify';
import { ironOptions } from 'constants/iron-session';
import { useAuth } from 'utils/useAuth';
import useIsMounted from 'utils/useIsMounted';
import { verifyDeckAccess } from 'utils/accessControl';
import { EthereumIcon } from 'components/EthereumIcon';
import Button from 'components/Button';

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
    <div className="mt-2">
      <Link href="/docs" className="focus:outline-none absolute top-3 right-6">
        <IconInfoCircle size={24} className="hover:text-gray-500" />
      </Link>
      <main className="container mt-28 lg:mt-48 flex flex-col">
        <div className="mx-auto pl-2 mb-16">
          <h1 className="text-5xl space-y-4 tracking-wider">
            <span className="block">
              <span className="hero-decoration">D</span>
              ecentralized
            </span>
            <span className="block">
              <span className="hero-decoration">E</span>ncrypted
            </span>
            <span className="block">
              <span className="hero-decoration">C</span>
              ollaborative
            </span>
            <span className="block">
              <span className="hero-decoration">K</span>nowledge
            </span>
          </h1>
        </div>

        <Button className="py-4 w-80 mx-auto" primary onClick={signIn}>
          <EthereumIcon />
          Sign-in with Ethereum
        </Button>
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
