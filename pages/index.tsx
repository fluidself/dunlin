// @ts-ignore
import LitJsSdk from 'lit-js-sdk';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { toast } from 'react-toastify';
import { ShareModal } from 'components/ShareModal';
import Button from 'components/Button';
import useIsMounted from 'utils/useIsMounted';
import { useAuth } from 'utils/useAuth';
import { AccessControlCondition, AuthSig, ResourceId } from 'types/lit';
import { EthereumIcon } from 'components/ShareModal/icons';

const Home: NextPage = () => {
  const router = useRouter();
  const [{ data: accountData }] = useAccount();
  const { user, isLoaded, signIn, signOut } = useAuth();
  const [open, setOpen] = useState<boolean>(false);
  // const [stringToEncrypt, setStringToEncrypt] = useState<string | null>(null);
  const [accessControlConditions, setAccessControlConditions] = useState<AccessControlCondition[] | null>(null);
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
        path: `/${user.id}`,
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

      const accessParamsToSave = { resource_id: resourceId, access_control_conditions: accessControlConditions };
      // console.log(accessParamsToSave);
      // await supabase.from<User>('users').update({ access_params: accessParamsToSave }).eq('id', userId);

      toast.success('Access to your DECK was successfully setup.');

      // setTimeout(async () => {
      //   await verifyAccess(user.id, resourceId, accessControlConditions);
      // }, 5000);
    } catch (e: any) {
      console.error(e);
      toast.error(`Provisioning access failed.`);
    }
  };

  const verifyAccess = async () => {
    // TODO: requestedDeck passed in from user when requesting to join a DECK
    // resourceId, accessControlConditions from DB
    const requestedDeck = '';
    const resourceId = {
      baseUrl: process.env.BASE_URL ?? '',
      path: `/${requestedDeck}`,
      orgId: '',
      role: '',
      extraData: '',
    };
    const accessControlConditions = [
      {
        contractAddress: '',
        standardContractType: '',
        chain: 'ethereum',
        method: '',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '=',
          value: '',
        },
      },
    ];

    // const { data: accessParams } = await supabase.from<User>('users').select('access_params').eq('id', requestedPath).single();

    // if (!accessParams?.access_params) return;

    // console.log('accessParams from DB: ', accessParams?.access_params);
    // const { resource_id: resourceId, access_control_conditions: accessControlConditions } = accessParams?.access_params;

    if (!requestedDeck || !resourceId || !accessControlConditions || !accessControlConditions[0].chain) return;

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
    // border border-gray-500 max-w-4xl min-h-72 mt-48 py-12 px-4 justify-between
    <main className="container text-white mt-36 lg:mt-72 flex flex-col items-center">
      <h1 className="mb-12 text-xl">Decentralized and Encrypted Collaborative Knowledge (DECK)</h1>

      {!user && (
        <Button className="py-4" onClick={signIn}>
          <EthereumIcon />
          Sign-in with Ethereum
        </Button>
      )}

      {isLoaded && accountData?.address && user?.id && (
        <div className="flex flex-col w-52">
          <Link href="/app">
            <a>
              <Button className="w-full my-2">Use your DECK</Button>
            </a>
          </Link>

          <Button className="w-full my-2" onClick={() => setOpen(true)}>
            Share your DECK
          </Button>

          <Button>Join a DECK</Button>

          <Button className="w-full my-2" onClick={verifyAccess}>
            Test Verification
          </Button>

          <Button onClick={signOut}>Sign out</Button>
        </div>
      )}

      {/* TODO: Join someone else's DECK
            before or after connecting wallet?
        */}

      {open && (
        <ShareModal
          onClose={() => setOpen(false)}
          // onStringProvided={(providedString: string) => setStringToEncrypt(providedString)}
          onAccessControlConditionsSelected={async (acc: AccessControlCondition[]) => {
            setAccessControlConditions(acc);
            setOpen(false);
            // await encryptString();
            await provisionAccess(acc);
          }}
          // showStep={'provideString'}
          showStep={'ableToAccess'}
        />
      )}

      {accessControlConditions ? (
        <>
          <h3>Selected conditions: </h3>
          <pre>{JSON.stringify(accessControlConditions, null, 2)}</pre>
        </>
      ) : null}
    </main>
  );
};

export default Home;
