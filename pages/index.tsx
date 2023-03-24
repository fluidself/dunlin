import { withIronSessionSsr } from 'iron-session/next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ironOptions } from 'constants/iron-session';
import selectDecks from 'lib/api/selectDecks';
import { useAuth } from 'utils/useAuth';
import { EthereumIcon } from 'components/EthereumIcon';
import Portal from 'components/Portal';
import DunlinIcon from 'components/DunlinIcon';
import OnboardingModal from 'components/onboarding/OnboardingModal';
import ErrorPage from 'components/ErrorPage';
import dunlinDemo from 'public/dunlin-demo.png';

export default function Home() {
  const router = useRouter();
  const { connector } = useAccount();
  const { user, signIn, signOut } = useAuth();
  const [onboardingModalState, setOnboardingModalState] = useState({ isOpen: false, hasError: false });
  const [hasClicked, setHasClicked] = useState(false);

  useEffect(() => {
    const onDisconnect = () => signOut();
    connector?.on('disconnect', onDisconnect);

    return () => {
      connector?.off('disconnect', onDisconnect);
    };
  }, [connector, signOut]);

  useEffect(() => {
    const onboardUser = async (userId: string) => {
      const decks = await selectDecks(userId, localStorage.getItem('dbToken') ?? '');
      if (decks.length) {
        router.push(`/app/${decks[decks.length - 1].id}`);
      } else if (hasClicked) {
        setOnboardingModalState(prevState => ({ ...prevState, isOpen: true }));
      }
    };

    if (user && hasClicked) {
      onboardUser(user.id);
    }
  }, [hasClicked, user, router]);

  const handleSignIn = async () => {
    setHasClicked(true);
    if (user) {
      setOnboardingModalState(prevState => ({ ...prevState, isOpen: true }));
      return;
    }
    await signIn();
  };

  if (onboardingModalState.hasError) {
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
          <Link
            href="/docs"
            className="focus:outline-none text-gray-300 hover:text-gray-100"
            aria-label="Documentation"
          >
            Docs
          </Link>
        </header>
        <main className="container flex flex-col overflow-y-hidden mt-16 md:mt-20 pb-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h1 className="text-3xl md:text-7xl font-bold leading-[3.5rem] md:!leading-[6rem] bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
              Organized knowledge.
            </h1>
            <div className="mt-6 md:mt-12 md:text-xl text-center">
              Dunlin is a note-taking app that helps individuals and communities capture, organize, make sense of, and
              share complex information.
            </div>
          </div>
          <button
            className="flex items-center justify-center px-6 py-2 rounded uppercase md:w-80 mx-auto border border-gray-500 bg-white text-gray-900 hover:text-gray-100 hover:bg-inherit hover:border-gray-100"
            onClick={handleSignIn}
          >
            <EthereumIcon />
            <span>Sign-in with Ethereum</span>
          </button>

          <Image src={dunlinDemo} alt="Dunlin editor" priority className="mt-24 border border-gray-600 rounded-lg" />
        </main>
      </div>
      {onboardingModalState.isOpen ? (
        <Portal>
          <OnboardingModal state={onboardingModalState} setState={setOnboardingModalState} />
        </Portal>
      ) : null}
    </>
  );
}

export const getServerSideProps = withIronSessionSsr(async function ({ req }) {
  const { user, recentDeck, dbToken } = req.session;

  if (!user) {
    return { props: {} };
  }

  if (recentDeck) {
    return { redirect: { destination: `/app/${recentDeck}`, permanent: false } };
  }

  const decks = await selectDecks(user.id, dbToken);

  return decks.length
    ? { redirect: { destination: `/app/${decks[decks.length - 1].id}`, permanent: false } }
    : { props: {} };
}, ironOptions);
