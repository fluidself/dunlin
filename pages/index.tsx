// @ts-ignore
import LitJsSdk from 'lit-js-sdk';
import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { toast } from 'react-toastify';
import { IconGitPullRequest, IconFolderPlus } from '@tabler/icons';
import supabase from 'lib/supabase';
import insertDeck from 'lib/api/insertDeck';
import { Deck, AccessParams } from 'types/supabase';
import useIsMounted from 'utils/useIsMounted';
import { useAuth } from 'utils/useAuth';
import { AccessControlCondition, AuthSig, ResourceId } from 'types/lit';
import HomeHeader from 'components/home/HomeHeader';
import { ShareModal } from 'components/ShareModal';
import { EthereumIcon } from 'components/home/EthereumIcon';
import RequestDeckAccess from 'components/home/RequestDeckAccess';
import ProvideDeckName from 'components/home/ProvideDeckName';
import Button from 'components/home/Button';
import DecksTable from 'components/home/DecksTable';

const Home: NextPage = () => {
  const router = useRouter();
  const [{ data: accountData }] = useAccount();
  const { user, isLoaded, signIn, signOut } = useAuth();
  const [decks, setDecks] = useState<Deck[] | null>(null);
  const [error, setError] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [deckToShare, setDeckToShare] = useState<string>('');
  const [requestingAccess, setRequestingAccess] = useState<boolean>(false);
  const [creatingDeck, setCreatingDeck] = useState<boolean>(false);
  const isMounted = useIsMounted();

  useEffect(() => {
    if (isLoaded && !accountData?.address) {
      signOut();
    }
  }, [accountData?.address]);

  useEffect(() => {
    const fetchDecks = async () => {
      const { data: decks, error } = await supabase.from<Deck>('decks').select('*').eq('user_id', user?.id).order('id');

      if (error) {
        setError(error.message);
      } else {
        setDecks(decks);
      }
    };

    if (user) {
      fetchDecks();
    }
  }, [user]);

  useEffect(() => {
    const initLit = async () => {
      // https://lit-protocol.github.io/lit-js-sdk/api_docs_html/index.html#litnodeclient
      const client = new LitJsSdk.LitNodeClient();
      await client.connect();
      window.litNodeClient = client;
    };

    if (!window.litNodeClient && isMounted() && user) {
      initLit();
    }
  }, [isMounted, user]);

  const provisionAccess = async (accessControlConditions: AccessControlCondition[]) => {
    if (!deckToShare || !accessControlConditions) return;

    try {
      const chain = accessControlConditions[0].chain;
      const authSig: AuthSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
      const resourceId: ResourceId = {
        baseUrl: process.env.BASE_URL ?? '',
        path: `/app/${deckToShare}`,
        orgId: '',
        role: '',
        extraData: '',
      };

      await window.litNodeClient.saveSigningCondition({
        accessControlConditions,
        chain,
        authSig,
        resourceId,
        permanent: false,
      });

      const accessParamsToSave: AccessParams = { resource_id: resourceId, access_control_conditions: accessControlConditions };
      await supabase.from<Deck>('decks').update({ access_params: accessParamsToSave }).eq('id', deckToShare);

      toast.success('Access to your DECK was successfully setup.');
    } catch (e: any) {
      console.error(e);
      toast.error(`Provisioning access failed.`);
    }
  };

  const verifyAccess = async (requestedDeck: string) => {
    if (!requestedDeck) return;

    const { data: accessParams } = await supabase.from<Deck>('decks').select('access_params').eq('id', requestedDeck).single();
    if (!accessParams?.access_params) return;

    const { resource_id: resourceId, access_control_conditions: accessControlConditions } = accessParams?.access_params;
    if (!resourceId || !accessControlConditions || !accessControlConditions[0].chain) return;

    try {
      const chain = accessControlConditions[0].chain;
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

      if (!response.ok) return;

      router.push(`/app/${requestedDeck}`);
    } catch (e: any) {
      console.error(e);
      toast.error(`Unable to verify access.`);
      // https://developer.litprotocol.com/docs/SDK/errorHandling
    }
  };

  const createNewDeck = async (deckName: string) => {
    if (!user) return;

    const deck = await insertDeck({ user_id: user.id, deck_name: deckName });

    if (!deck) {
      toast.error('There was an error creating the DECK');
      return;
    }

    toast.success(`Successfully created ${deck.deck_name}`);
    router.push(`/app/${deck.id}`);
  };

  return (
    <div className="mt-3 text-white">
      <div className="flex flex-col items-end text-white min-h-[24px] pr-8">{user && <HomeHeader />}</div>
      <main className="container mt-28 lg:mt-52 flex flex-col">
        <h1 className="mb-12 text-xl text-center">Decentralized and Encrypted Collaborative Knowledge (DECK)</h1>
        {/* TODO: fix flash of wrong rendering */}
        {/* TODO: more landing page content? */}
        {!user && (
          <Button className="py-4 w-80 mx-auto" onClick={signIn}>
            <EthereumIcon />
            Sign-in with Ethereum
          </Button>
        )}

        <div className="w-4/5 mx-auto">
          {decks && (
            <DecksTable
              decks={decks}
              onShareClick={(deckId: string) => {
                setDeckToShare(deckId);
                setOpen(true);
              }}
            />
          )}

          {/* TODO: better intro text */}
          {user && !decks && <div className="text-center">Get started by creating a new DECK or joining one.</div>}

          {isLoaded && accountData?.address && user && (
            <div className="flex flex-col w-1/2 mx-auto mt-12 space-y-4">
              {creatingDeck ? (
                <ProvideDeckName
                  onCancel={() => setCreatingDeck(false)}
                  onDeckNameProvided={async (deckName: string) => {
                    console.log(deckName);
                    await createNewDeck(deckName);
                  }}
                />
              ) : (
                <Button onClick={() => setCreatingDeck(true)} className="">
                  <IconFolderPlus size={20} className="mr-2" />
                  Create a new DECK
                </Button>
              )}

              {requestingAccess ? (
                <RequestDeckAccess
                  onCancel={() => setRequestingAccess(false)}
                  onDeckAccessRequested={async (requestedDeck: string) => {
                    console.log(requestedDeck);
                    await verifyAccess(requestedDeck);
                  }}
                />
              ) : (
                <Button className="" onClick={() => setRequestingAccess(true)}>
                  <IconGitPullRequest size={20} className="mr-2" />
                  Join a DECK
                </Button>
              )}
            </div>
          )}
        </div>

        {open && (
          <ShareModal
            onClose={() => setOpen(false)}
            onAccessControlConditionsSelected={async (acc: AccessControlCondition[]) => {
              setOpen(false);
              await provisionAccess(acc);
            }}
            showStep={'ableToAccess'}
          />
        )}
      </main>
    </div>
  );
};

export default Home;
