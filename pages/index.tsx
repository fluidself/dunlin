import { withIronSessionSsr } from 'iron-session/next';
import { useRouter } from 'next/router';
import { IconInfoCircle } from '@tabler/icons';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { ironOptions } from 'constants/iron-session';
import selectDecks from 'lib/api/selectDecks';
import { useAuth } from 'utils/useAuth';
import { EthereumIcon } from 'components/home/EthereumIcon';
import Button from 'components/home/Button';

export default function Home() {
  const [{ data: accountData }] = useAccount();
  const { signIn, signOut, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push('/');
  }, [user, router]);

  useEffect(() => {
    const onDisconnect = () => signOut();
    accountData?.connector?.on('disconnect', onDisconnect);

    return () => {
      accountData?.connector?.off('disconnect', onDisconnect);
    };
  }, [accountData?.connector, signOut]);

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

export const getServerSideProps = withIronSessionSsr(async function ({ req }) {
  const { user, recentDeck } = req.session;

  if (!user) {
    return { props: {} };
  }

  if (recentDeck) {
    return { redirect: { destination: `/app/${recentDeck}`, permanent: false } };
  }

  const decks = await selectDecks(user.id);

  return decks.length
    ? { redirect: { destination: `/app/${decks[decks.length - 1].id}`, permanent: false } }
    : { redirect: { destination: '/app', permanent: false } };
}, ironOptions);
