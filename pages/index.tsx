// @ts-ignore
import LitJsSdk from 'lit-js-sdk';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { toast } from 'react-toastify';
import { IconPencil, IconShare, IconGitPullRequest, IconFilePlus } from '@tabler/icons';
import supabase from 'lib/supabase';
import insertDeck from 'lib/api/insertDeck';
import { Deck, AccessParams } from 'types/supabase';
import useIsMounted from 'utils/useIsMounted';
import { useAuth } from 'utils/useAuth';
import { AccessControlCondition, AuthSig, ResourceId } from 'types/lit';
import HomeHeader from 'components/HomeHeader';
import { ShareModal } from 'components/ShareModal';
import { EthereumIcon } from 'components/EthereumIcon';
import RequestDeckAccess from 'components/RequestDeckAccess';
import Button from 'components/Button';

const Home: NextPage = () => {
  const router = useRouter();
  const [{ data: accountData }] = useAccount();
  const { user, isLoaded, signIn, signOut } = useAuth();
  const [open, setOpen] = useState<boolean>(false);
  const [requestingAccess, setRequestingAccess] = useState<boolean>(false);
  const isMounted = useIsMounted();

  useEffect(() => {
    if (isLoaded && !accountData?.address) {
      signOut();
    }
  }, [accountData?.address]);

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

  const provisionAccess = async (deckId: string, accessControlConditions: AccessControlCondition[]) => {
    if (!deckId || !accessControlConditions) return;

    try {
      const chain = accessControlConditions[0].chain;
      const authSig: AuthSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
      const resourceId: ResourceId = {
        baseUrl: process.env.BASE_URL ?? '',
        path: `/app/${deckId}`,
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
      await supabase.from<Deck>('decks').update({ access_params: accessParamsToSave }).eq('id', deckId);

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
      // router.push('/app/protected');
    } catch (e: any) {
      console.error(e);
      toast.error(`Unable to verify access.`);
      // https://developer.litprotocol.com/docs/SDK/errorHandling
    }
  };

  const createNewDeck = async () => {
    if (!user) return;

    const deck = await insertDeck({ user_id: user.id }); // deck_name?

    if (!deck) {
      toast.error('There was an error creating the DECK');
      return;
    }

    toast.success(`Successfully created DECK ${deck.id}`); // deck_name?
    router.push(`/app/${deck.id}`);
  };

  return (
    <div className="mt-3 text-white">
      <div className="flex flex-col items-end text-white min-h-[24px] pr-8">{user && <HomeHeader />}</div>
      <main className="container mt-36 lg:mt-72 flex flex-col items-center">
        <h1 className="mb-12 text-xl">Decentralized and Encrypted Collaborative Knowledge (DECK)</h1>

        {!user && (
          <Button className="py-4" onClick={signIn}>
            <EthereumIcon />
            Sign-in with Ethereum
          </Button>
        )}

        {isLoaded && accountData?.address && user && (
          // Welcome/helper text

          // 1. new user:
          // create a deck
          // join a deck

          // 2. user who owns decks
          // your decks grid with buttons
          //// use your deck
          //// share your deck

          // create a deck
          // join a deck
          <div className="w-2/5 grid grid-cols-2 gap-4">
            <Link href="/app">
              <a>
                <Button className="w-full">
                  <IconPencil size={20} className="mr-2" />
                  Use your DECK
                </Button>
              </a>
            </Link>

            {/* TODO: ask for deck_name ? */}
            <Button onClick={createNewDeck}>
              <IconFilePlus size={20} className="mr-2" />
              Create a new DECK
            </Button>

            <Button onClick={() => setOpen(true)}>
              <IconShare size={20} className="mr-2" />
              Share your DECK
            </Button>

            <div className="col-span-2">
              {!requestingAccess && (
                <Button className="w-full" onClick={() => setRequestingAccess(true)}>
                  <IconGitPullRequest size={20} className="mr-2" />
                  Join a DECK
                </Button>
              )}

              {requestingAccess && (
                <RequestDeckAccess
                  onCancel={() => setRequestingAccess(false)}
                  onDeckAccessRequested={async (requestedDeck: string) => {
                    console.log(requestedDeck);
                    // await verifyAccess(requestedDeck);
                  }}
                />
              )}
            </div>
          </div>
        )}

        {open && (
          <ShareModal
            onClose={() => setOpen(false)}
            onAccessControlConditionsSelected={async (acc: AccessControlCondition[]) => {
              setOpen(false);
              // TODO: where to get deckId from? bring back ProvideString component?
              const deckId = '';
              await provisionAccess(deckId, acc);
            }}
            showStep={'ableToAccess'}
          />
        )}
      </main>
    </div>
  );
};

export default Home;
