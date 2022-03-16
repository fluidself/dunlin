// @ts-ignore
import LitJsSdk from 'lit-js-sdk';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { toast } from 'react-toastify';
import supabase from 'lib/supabase';
import { User, AccessParams } from 'types/supabase';
import useIsMounted from 'utils/useIsMounted';
import { useAuth } from 'utils/useAuth';
import { AccessControlCondition, AuthSig, ResourceId } from 'types/lit';
import { ShareModal } from 'components/ShareModal';
import { EthereumIcon } from 'components/ShareModal/icons';
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

  const provisionAccess = async (accessControlConditions: AccessControlCondition[]) => {
    if (!user || !accessControlConditions) return;

    try {
      const chain = accessControlConditions[0].chain;
      const authSig: AuthSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
      const resourceId: ResourceId = {
        baseUrl: process.env.BASE_URL ?? '',
        path: `/app/${user.id}`,
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
      await supabase.from<User>('users').update({ access_params: accessParamsToSave }).eq('id', user.id);

      toast.success('Access to your DECK was successfully setup.');
    } catch (e: any) {
      console.error(e);
      toast.error(`Provisioning access failed.`);
    }
  };

  const verifyAccess = async (requestedDeck: string) => {
    if (!requestedDeck) return;

    const { data: accessParams } = await supabase.from<User>('users').select('access_params').eq('id', requestedDeck).single();
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

      router.push('/app/protected');
      // router.push(`/app/${requestedDeck}`);
    } catch (e: any) {
      console.error(e);
      toast.error(`Unable to verify access.`);
      // https://developer.litprotocol.com/docs/SDK/errorHandling
    }
  };

  return (
    <main className="container text-white mt-36 lg:mt-72 flex flex-col items-center">
      <h1 className="mb-12 text-xl">Decentralized and Encrypted Collaborative Knowledge (DECK)</h1>

      {!user && (
        <Button className="py-4" onClick={signIn}>
          <EthereumIcon />
          Sign-in with Ethereum
        </Button>
      )}

      {isLoaded && accountData?.address && user && (
        <div className="w-2/5 grid grid-cols-2 gap-4">
          <Link href="/app">
            <a>
              <Button className="w-full">Use your DECK</Button>
            </a>
          </Link>

          <Button className="" onClick={() => setOpen(true)}>
            Share your DECK
          </Button>

          <div className="col-span-2">
            {!requestingAccess && (
              <Button className="w-full" onClick={() => setRequestingAccess(true)}>
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

          {/* <Button onClick={signOut}>Sign out</Button> */}
        </div>
      )}

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
  );
};

export default Home;
