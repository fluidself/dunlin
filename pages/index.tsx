import { withIronSessionSsr } from 'iron-session/next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import useSWR from 'swr';
import { ironOptions } from 'constants/iron-session';
import selectDecks from 'lib/api/selectDecks';
import { useAuth } from 'utils/useAuth';
import { EthereumIcon } from 'components/EthereumIcon';
import Button from 'components/Button';
import Portal from 'components/Portal';
import OnboardingModal from 'components/onboarding/OnboardingModal';
import dunlinLogo from 'public/dunlin-logo.png';
import dunlinDemo from 'public/dunlin-demo.png';

export default function Home() {
  const router = useRouter();
  const { connector } = useAccount();
  const { signIn, signOut, user, isLoaded } = useAuth();
  const { data: decks } = useSWR(user ? 'decks' : null, () => selectDecks(user?.id), { revalidateOnFocus: false });
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);

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
    } else if (hasClicked && isLoaded && user && decks?.length === 0) {
      setIsOnboardingModalOpen(true);
    } else {
      setIsOnboardingModalOpen(false);
    }
  }, [hasClicked, isLoaded, user, decks, router]);

  const handleSignIn = async () => {
    setHasClicked(true);

    if (user) {
      setIsOnboardingModalOpen(true);
      return;
    }

    await signIn();
  };

  return (
    <>
      <div id="app-container" className="h-screen">
        <header className="flex justify-between items-center px-2 py-2 md:px-10 md:py-6">
          <div className="flex items-center">
            <Image src={dunlinLogo} alt="Dunlin logo" priority width={24} height={24} />
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
              Dunlin is a note-taking app that helps individuals and communities capture, organize, make sense of, and share
              complex information.
            </div>
          </div>

          <Button className="md:w-80 mx-auto" primary onClick={handleSignIn}>
            <EthereumIcon />
            <span>Sign-in with Ethereum</span>
          </Button>

          <Image src={dunlinDemo} alt="Dunlin editor" priority className="mt-24 border border-gray-600 rounded-lg" />
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
