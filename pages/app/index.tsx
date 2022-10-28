import LitJsSdk from 'lit-js-sdk';
import { withIronSessionSsr } from 'iron-session/next';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { toast } from 'react-toastify';
import { ironOptions } from 'constants/iron-session';
import supabase from 'lib/supabase';
import insertDeck from 'lib/api/insertDeck';
import selectDecks from 'lib/api/selectDecks';
import { Note } from 'types/supabase';
import { generateKey, encryptWithLit, encryptNote } from 'utils/encryption';
import createOnboardingNotes from 'utils/createOnboardingNotes';
import { verifyDeckAccess } from 'utils/accessControl';
import useIsMounted from 'utils/useIsMounted';
import { useAuth } from 'utils/useAuth';
import HomeHeader from 'components/home/HomeHeader';
import RequestDeckAccess from 'components/home/RequestDeckAccess';
import ProvideDeckName from 'components/home/ProvideDeckName';
import create from 'public/create-logo.svg';
import join from 'public/join-logo.svg';

export default function AppHome() {
  const router = useRouter();
  const [{ data: accountData }] = useAccount();
  const { user, isLoaded, signOut } = useAuth();
  const [requestingAccess, setRequestingAccess] = useState<boolean>(false);
  const [creatingDeck, setCreatingDeck] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const isMounted = useIsMounted();

  useEffect(() => {
    const initLit = async () => {
      const client = new LitJsSdk.LitNodeClient({ alertWhenUnauthorized: false, debug: false });
      await client.connect();
      window.litNodeClient = client;
    };

    if (!user) {
      router.push('/');
    } else if (!window.litNodeClient && isMounted() && user) {
      initLit();
    }
  }, [isMounted, user, router]);

  useEffect(() => {
    const onDisconnect = () => signOut();
    accountData?.connector?.on('disconnect', onDisconnect);

    return () => {
      accountData?.connector?.off('disconnect', onDisconnect);
    };
  }, [accountData?.connector, signOut]);

  const createNewDeck = async (deckName: string) => {
    if (!user) return;
    setProcessing(true);

    const deckKey = generateKey();
    const accessControlConditions = [
      {
        contractAddress: '',
        standardContractType: '',
        chain: 'ethereum',
        method: '',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '=',
          value: user.id,
        },
      },
    ];
    const [encryptedStringBase64, encryptedSymmetricKeyBase64] = await encryptWithLit(deckKey, accessControlConditions);
    const accessParams = {
      encrypted_string: encryptedStringBase64,
      encrypted_symmetric_key: encryptedSymmetricKeyBase64,
      access_control_conditions: accessControlConditions,
    };

    const deck = await insertDeck({
      user_id: user.id,
      deck_name: deckName,
      author_only_notes: false,
      author_control_notes: false,
      access_params: accessParams,
    });

    if (!deck) {
      toast.error('There was an error creating the DECK');
      setProcessing(false);
      return;
    }

    const onboardingNotes = createOnboardingNotes();
    const upsertData = onboardingNotes.map(note =>
      encryptNote({ ...note, deck_id: deck.id, user_id: user.id, author_only: false }, deckKey),
    );

    await supabase.from<Note>('notes').upsert(upsertData);

    toast.success(`Successfully created ${deckName}`);
    router.push(`/app/${deck.id}`);
    setProcessing(false);
  };

  const verifyAccess = async (requestedDeck: string) => {
    if (!requestedDeck || !user) return;
    setProcessing(true);

    const success = await verifyDeckAccess(requestedDeck, user);

    if (success) {
      toast.success('Access to DECK is granted');
      router.push(`/app/${requestedDeck}`);
    } else {
      toast.error('Unable to verify access');
    }

    setProcessing(false);
  };

  return (
    <div id="app-container" className="h-screen font-display">
      <div className="flex flex-col w-full h-full bg-gray-900 text-gray-100">
        <div className="flex flex-col items-end text-white min-h-[27px] pr-8 mt-2">{isLoaded && user && <HomeHeader />}</div>
        <div className="flex flex-col flex-1 lg:overflow-y-hidden container">
          <div className="flex flex-col items-center flex-1 w-full lg:p-12">
            <h1 className="mb-12 text-3xl text-center mt-12 lg:mt-36">Welcome aboard</h1>
            {creatingDeck && (
              <div className="lg:w-1/2 mt-20">
                <ProvideDeckName
                  onCancel={() => setCreatingDeck(false)}
                  processing={processing}
                  onDeckNameProvided={async (deckName: string) => await createNewDeck(deckName)}
                />
              </div>
            )}
            {requestingAccess && (
              <div className="lg:w-1/2 mt-20">
                <RequestDeckAccess
                  onCancel={() => setRequestingAccess(false)}
                  processing={processing}
                  onDeckAccessRequested={async (requestedDeck: string) => await verifyAccess(requestedDeck)}
                />
              </div>
            )}
            {!creatingDeck && !requestingAccess && (
              <div className="flex flex-wrap gap-10 justify-center lg:mt-6">
                <button
                  className="flex flex-col justify-between items-center py-4 w-[280px] h-[260px] border border-white cursor-pointer box-border text-white hover:bg-gray-800 focus:bg-gray-800"
                  onClick={() => setCreatingDeck(true)}
                >
                  <Image src={create} width={256} height={256} alt="Create DECK" layout="fixed" priority />
                  <div className="mt-2">Create a new DECK</div>
                </button>

                <button
                  className="flex flex-col justify-between items-center py-4 w-[280px] h-[260px] border border-white cursor-pointer box-border text-white hover:bg-gray-800 focus:bg-gray-800"
                  onClick={() => setRequestingAccess(true)}
                >
                  <Image src={join} width={256} height={256} alt="Join DECK" layout="fixed" priority />
                  <div className="mt-2">Join a DECK</div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps = withIronSessionSsr(async function ({ req }) {
  const { user, recentDeck } = req.session;

  if (!user) {
    return { redirect: { destination: '/', permanent: false } };
  }

  if (recentDeck) {
    return { redirect: { destination: `/app/${recentDeck}`, permanent: false } };
  }

  const decks = await selectDecks(user.id);

  return decks.length ? { redirect: { destination: `/app/${decks[decks.length - 1].id}`, permanent: false } } : { props: {} };
}, ironOptions);
