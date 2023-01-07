import { withIronSessionSsr } from 'iron-session/next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IconInfoCircle } from '@tabler/icons';
import { useAccount } from 'wagmi';
import useSWR from 'swr';
import { ironOptions } from 'constants/iron-session';
import selectDecks from 'lib/api/selectDecks';
import { useAuth } from 'utils/useAuth';
import { EthereumIcon } from 'components/home/EthereumIcon';
import OnboardingModal from 'components/onboarding/OnboardingModal';
import Button from 'components/home/Button';
import Portal from 'components/Portal';

export default function Home() {
  const router = useRouter();
  const { connector } = useAccount();
  const { signIn, signOut, user, isLoaded } = useAuth();
  const { data: decks } = useSWR(user ? 'decks' : null, () => selectDecks(user?.id), { revalidateOnFocus: false });
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  useEffect(() => {
    const onDisconnect = () => signOut();
    connector?.on('disconnect', onDisconnect);

    return () => {
      connector?.off('disconnect', onDisconnect);
    };
  }, [connector, signOut]);

  useEffect(() => {
    if (decks?.length) {
      router.push(`/app/${decks[decks.length - 1].id}`);
    } else if (isLoaded && user && decks?.length === 0) {
      setIsOnboardingModalOpen(true);
    } else {
      setIsOnboardingModalOpen(false);
    }
  }, [isLoaded, user, decks, router]);

  const handleSignIn = async () => {
    if (user) {
      setIsOnboardingModalOpen(true);
      return;
    }

    await signIn();
  };

  return (
    <>
      <div id="app-container" className="h-screen">
        <header className="flex justify-between items-center px-8 py-4">
          <div className="flex">
            <Image src="/favicon-32x32.png" alt="Dunlin logo" width={24} height={24} />
            <h2 className="ml-2">Dunlin</h2>
          </div>
          <Link href="/docs" className="focus:outline-none" aria-label="Documentation">
            <IconInfoCircle size={24} className="hover:text-gray-400" />
          </Link>
        </header>
        <main className="container flex flex-col overflow-y-hidden mt-20 md:mt-52">
          <div className="mx-auto pl-2 mb-16">
            <h1 className="text-4xl md:text-5xl space-y-4 tracking-wider">
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

          <Button className="py-4 md:w-80 mx-auto" primary onClick={handleSignIn}>
            <EthereumIcon />
            <span>Sign-in with Ethereum</span>
          </Button>
        </main>
      </div>
      {isOnboardingModalOpen ? (
        <Portal>
          <OnboardingModal setIsOpen={setIsOnboardingModalOpen} />
        </Portal>
      ) : null}
    </>
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

  return decks.length ? { redirect: { destination: `/app/${decks[decks.length - 1].id}`, permanent: false } } : { props: {} };
}, ironOptions);
