import { withIronSessionSsr } from 'iron-session/next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { IconInfoCircle } from '@tabler/icons';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import LitJsSdk from 'lit-js-sdk';
import { toast } from 'react-toastify';
import { ironOptions } from 'constants/iron-session';
import { useAuth } from 'utils/useAuth';
import useIsMounted from 'utils/useIsMounted';
import { verifyDeckAccess } from 'utils/accessControl';
import { EthereumIcon } from 'components/home/EthereumIcon';
import Button from 'components/home/Button';

type Props = {
  deckId: string;
};

export default function JoinDeck({ deckId }: Props) {
  const [{ data: accountData }] = useAccount();
  const { user, signIn, signOut } = useAuth();
  const isMounted = useIsMounted();
  const router = useRouter();

  useEffect(() => {
    const initLit = async () => {
      const client = new LitJsSdk.LitNodeClient({ alertWhenUnauthorized: false, debug: false });
      await client.connect();
      window.litNodeClient = client;
    };

    if (!window.litNodeClient && isMounted()) {
      initLit();
    }
  }, [isMounted]);

  useEffect(() => {
    const onDisconnect = () => signOut();
    accountData?.connector?.on('disconnect', onDisconnect);

    return () => {
      accountData?.connector?.off('disconnect', onDisconnect);
    };
  }, [accountData?.connector, signOut]);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!deckId) return;

      try {
        await verifyDeckAccess(deckId);
        toast.success('Access to DECK is granted');
        router.push(`/app/${deckId}`);
      } catch (error) {
        toast.error('Unable to verify access');
        router.push(`/app`);
      }
    };

    if (user) verifyAccess();
  }, [user, deckId, router]);

  return (
    <div className="mt-2">
      <Link href={`${process.env.BASE_URL}/docs`}>
        <a className="focus:outline-none absolute top-3 right-6">
          <IconInfoCircle size={24} className="hover:text-gray-500" />
        </a>
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
