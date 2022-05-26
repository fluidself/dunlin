// @ts-ignore
import LitJsSdk from 'lit-js-sdk';
import { withIronSessionSsr } from 'iron-session/next';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import useSWR from 'swr';
import { toast } from 'react-toastify';
import { encrypt } from '@metamask/browser-passworder';
import { ironOptions } from 'constants/iron-session';
import supabase from 'lib/supabase';
import insertDeck from 'lib/api/insertDeck';
import selectDecks from 'lib/api/selectDecks';
import { Deck, Note } from 'types/supabase';
import { decryptWithLit, encryptWithLit } from 'utils/encryption';
import createOnboardingNotes from 'utils/createOnboardingNotes';
import useIsMounted from 'utils/useIsMounted';
import { useAuth } from 'utils/useAuth';
// import { AuthSig } from 'types/lit';
import HomeHeader from 'components/home/HomeHeader';
import RequestDeckAccess from 'components/home/RequestDeckAccess';
import ProvideDeckName from 'components/home/ProvideDeckName';
import create from 'public/create-logo.svg';
import join from 'public/join-logo.svg';

export default function AppHome() {
  const router = useRouter();
  const [{ data: accountData }] = useAccount();
  const { user, isLoaded, signOut } = useAuth();
  const { data: decks } = useSWR(user ? 'decks' : null, () => selectDecks(user?.id), { revalidateOnFocus: false });
  const [requestingAccess, setRequestingAccess] = useState<boolean>(false);
  const [creatingDeck, setCreatingDeck] = useState<boolean>(false);
  const isMounted = useIsMounted();

  useEffect(() => {
    const initLit = async () => {
      const client = new LitJsSdk.LitNodeClient({ alertWhenUnauthorized: false, debug: false });
      await client.connect();
      window.litNodeClient = client;
    };

    if (!window.litNodeClient && isMounted() && user) {
      initLit();
    }
  }, [isMounted, user]);

  useEffect(() => {
    const onDisconnect = () => signOut();
    accountData?.connector?.on('disconnect', onDisconnect);

    return () => {
      accountData?.connector?.off('disconnect', onDisconnect);
    };
  }, [accountData?.connector, signOut]);

  const createNewDeck = async (deckName: string) => {
    if (!user) return;

    const array = new Uint8Array(32);
    global.crypto.getRandomValues(array);
    const deckKey = Buffer.from(array).toString('hex');
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
      access_params: accessParams,
    });

    if (!deck) {
      toast.error('There was an error creating the DECK');
      return;
    }

    const onboardingNotes = createOnboardingNotes();
    const promises = [];
    for (const note of onboardingNotes) {
      const encryptedTitle = await encrypt(deckKey, note.title);
      const encryptedContent = await encrypt(deckKey, note.content);
      promises.push(
        supabase
          .from<Note>('notes')
          .upsert({ ...note, title: encryptedTitle, content: encryptedContent, deck_id: deck.id })
          .single(),
      );
    }
    await Promise.all(promises);

    toast.success(`Successfully created ${deckName}`);
    router.push(`/app/${deck.id}`);
  };

  const verifyAccess = async (requestedDeck: string) => {
    if (!requestedDeck) return;

    if (decks?.find(deck => deck.id === requestedDeck)) {
      toast.success('You own that DECK!');
      setRequestingAccess(false);
      router.push(`/app/${requestedDeck}`);
      return;
    }

    const { data, error } = await supabase.from<Deck>('decks').select('access_params').eq('id', requestedDeck).single();
    if (!data || error) {
      toast.error('Unable to verify access.');
      return;
    }

    try {
      // TODO: hotfix to only allow EVM chains for now
      const { encrypted_string, encrypted_symmetric_key, access_control_conditions } = data.access_params;
      const deckKey = await decryptWithLit(encrypted_string, encrypted_symmetric_key, access_control_conditions);
      if (!deckKey) {
        toast.error('Unable to verify access.');
        return;
      }

      // TODO: keep / refactor this?
      await fetch('/api/verify-deck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ allowedDeck: requestedDeck }),
      });

      toast.success('Access to DECK is granted.');
      router.push(`/app/${requestedDeck}`);
    } catch (e: any) {
      toast.error('Unable to verify access.');
    }
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
                  onDeckNameProvided={async (deckName: string) => await createNewDeck(deckName)}
                />
              </div>
            )}
            {requestingAccess && (
              <div className="lg:w-1/2 mt-20">
                <RequestDeckAccess
                  onCancel={() => setRequestingAccess(false)}
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

  if (user && recentDeck) {
    return { redirect: { destination: `/app/${recentDeck}`, permanent: false } };
  }

  const decks = await selectDecks(user?.id);

  if (decks.length) {
    return { redirect: { destination: `/app/${decks[decks.length - 1].id}`, permanent: false } };
  } else {
    return user ? { props: {} } : { redirect: { destination: '/', permanent: false } };
  }
}, ironOptions);
