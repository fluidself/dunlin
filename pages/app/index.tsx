// @ts-ignore
import LitJsSdk from 'lit-js-sdk';
import { withIronSessionSsr } from 'iron-session/next';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import useSWR from 'swr';
import { toast } from 'react-toastify';
import { ironOptions } from 'constants/iron-session';
import supabase from 'lib/supabase';
import insertDeck from 'lib/api/insertDeck';
import selectDecks from 'lib/api/selectDecks';
import { Deck } from 'types/supabase';
import useIsMounted from 'utils/useIsMounted';
import { useAuth } from 'utils/useAuth';
import { AuthSig } from 'types/lit';
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

    const deck = await insertDeck({ user_id: user.id, deck_name: deckName });

    if (!deck) {
      toast.error('There was an error creating the DECK');
      return;
    }

    toast.success(`Successfully created ${deck.deck_name}`);
    setCreatingDeck(false);
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

    const { data: accessParams } = await supabase.from<Deck>('decks').select('access_params').eq('id', requestedDeck).single();
    if (!accessParams?.access_params) {
      toast.error('Unable to verify access.');
      return;
    }

    const { resource_id: resourceId, access_control_conditions: accessControlConditions } = accessParams?.access_params || {};
    if (!resourceId || !accessControlConditions || !accessControlConditions[0].chain) {
      toast.error('Unable to verify access.');
      return;
    }

    try {
      // TODO: hotfix to only allow EVM chains for now
      // const chain = accessControlConditions[0].chain;
      const chain = 'ethereum';
      const authSig: AuthSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
      const jwt = await window.litNodeClient.getSignedToken({
        accessControlConditions,
        chain,
        authSig,
        resourceId,
      });

      const response = await fetch('/api/verify-jwt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jwt, requestedDeck }),
      });

      if (!response.ok) {
        toast.error('Unable to verify access.');
        return;
      }

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
        <div className="flex flex-col flex-1 overflow-y-hidden container">
          <div className="flex flex-col items-center flex-1 w-full p-12">
            <h1 className="mb-12 text-3xl text-center mt-24 lg:mt-36">Welcome aboard</h1>
            {creatingDeck && (
              <div className="w-1/2 mt-20">
                <ProvideDeckName
                  onCancel={() => setCreatingDeck(false)}
                  onDeckNameProvided={async (deckName: string) => await createNewDeck(deckName)}
                />
              </div>
            )}
            {requestingAccess && (
              <div className="w-1/2 mt-20">
                <RequestDeckAccess
                  onCancel={() => setRequestingAccess(false)}
                  onDeckAccessRequested={async (requestedDeck: string) => await verifyAccess(requestedDeck)}
                />
              </div>
            )}
            {!creatingDeck && !requestingAccess && (
              <div className="flex lg:flex-row space-x-10 justify-center mt-[20px]">
                <button
                  className="flex flex-col justify-between items-center py-4 w-[280px] h-[260px] border border-white cursor-pointer box-border text-white hover:bg-gray-800 focus:bg-gray-800"
                  onClick={() => setCreatingDeck(true)}
                >
                  <Image src={create} width={256} height={256} alt="Create DECK" layout="fixed" className="" />
                  <div className="mt-2">Create a new DECK</div>
                </button>

                <button
                  className="flex flex-col justify-between items-center py-4 w-[280px] h-[260px] border border-white cursor-pointer box-border text-white hover:bg-gray-800 focus:bg-gray-800"
                  onClick={() => setRequestingAccess(true)}
                >
                  <Image src={join} width={256} height={256} alt="Join DECK" layout="fixed" className="" />
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
