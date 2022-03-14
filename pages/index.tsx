// @ts-ignore
import LitJsSdk from 'lit-js-sdk';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useConnect } from 'wagmi';
import { toast } from 'react-toastify';
import { ShareModal } from 'components/ShareModal';
import Button from 'components/Button';
import useIsMounted from 'utils/useIsMounted';
import { useIpfsUpload } from 'utils/useIpfs';
import supabase from 'lib/supabase';
import { User } from 'types/supabase';
import { AccessControlCondition, AuthSig, ResourceId } from 'types/lit';

const Home: NextPage = () => {
  const router = useRouter();
  const [
    {
      data: { connectors },
      error,
    },
    connect,
  ] = useConnect();
  const [{ data: accountData }] = useAccount();
  const [open, setOpen] = useState<boolean>(false);
  const [stringToEncrypt, setStringToEncrypt] = useState<string | null>(null);
  const [accessControlConditions, setAccessControlConditions] = useState<AccessControlCondition[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const isMounted = useIsMounted();

  const initUser = async (walletAddress: string) => {
    const response = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });

    if (response.status !== 200) return;

    const user = await response.json();

    setIsLoaded(true);
  };

  useEffect(() => {
    if (accountData?.address && !isLoaded) {
      setUserId(accountData?.address);
      initUser(accountData?.address);
    }
    // } else if (isLoaded) {
    //   router.push('/app');
    // }
  }, [accountData?.address, isLoaded]);

  useEffect(() => {
    const initLit = async () => {
      const client = new LitJsSdk.LitNodeClient();
      await client.connect();
      window.litNodeClient = client;
    };
    if (isMounted()) {
      initLit();
    }
  }, [isMounted]);

  const encryptString = async () => {
    // TODO: some kind of loading indicator spinner / feedback toasts
    const userId = accountData?.address;
    // console.log('================');
    // console.log(userId, stringToEncrypt, accessControlConditions);
    // console.log('================');
    if (!userId || !stringToEncrypt || !accessControlConditions) return;

    const chain = accessControlConditions[0].chain;
    const authSig: AuthSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
    const { encryptedZip, symmetricKey } = await LitJsSdk.zipAndEncryptString(stringToEncrypt);
    const encryptedSymmetricKey = await window.litNodeClient.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain,
    });
    const encryptedZipBase64 = Buffer.from(await encryptedZip.arrayBuffer()).toString('base64');
    const hexEncryptedSymmetricKey = LitJsSdk.uint8arrayToString(encryptedSymmetricKey, 'base16');

    const ipfsHashes = await useIpfsUpload(userId, [
      { key: 'encryptedZipBase64', file: encryptedZipBase64 },
      { key: 'hexEncryptedSymmetricKey', file: hexEncryptedSymmetricKey },
      { key: 'accessControlConditions', file: accessControlConditions },
    ]);
    console.log('ipfsHashes', ipfsHashes);

    await supabase.from<User>('users').update({ ipfs_hashes: ipfsHashes }).eq('id', userId);
  };

  const decryptString = async () => {
    // get hashes from DB, then fetch from fleek:
    // where to get userId from? passed in when user requests access to workspace
    const userId = '';
    const { data: ipfsHashes } = await supabase.from<User>('users').select('ipfs_hashes').eq('id', userId).single();

    if (ipfsHashes?.ipfs_hashes) {
      console.log('ipfsHashes from DB: ', ipfsHashes?.ipfs_hashes);
      const { encryptedZipBase64, hexEncryptedSymmetricKey, accessControlConditions } = ipfsHashes?.ipfs_hashes;

      if (!accessControlConditions || !hexEncryptedSymmetricKey || !accessControlConditions[0].chain || !encryptedZipBase64) {
        return;
      }

      try {
        const chain = accessControlConditions[0].chain;
        const authSig: AuthSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
        const symmetricKey = await window.litNodeClient.getEncryptionKey({
          accessControlConditions,
          toDecrypt: hexEncryptedSymmetricKey,
          chain,
          authSig,
        });
        const blobFile = new Uint8Array(Buffer.from(encryptedZipBase64, 'base64'));
        const decryptedFiles = await LitJsSdk.decryptZip(new Blob([blobFile]), symmetricKey);
        const decryptedString = await decryptedFiles['string.txt'].async('text');

        console.log(`==========\n${decryptedString}============`);
        // alert user of this string and ask them to enter it? => access granted
        // better: the fact that they could decrypt it is enough => access granted
      } catch (e) {
        // was not able to decrypt => user does not have access
        // https://developer.litprotocol.com/docs/SDK/errorHandling
        // toast / render feedback
      }
    }
  };

  const provisionAccess = async (accessControlConditions: AccessControlCondition[]) => {
    if (!userId || !accessControlConditions) return;

    try {
      const chain = accessControlConditions[0].chain;
      const authSig: AuthSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
      const resourceId: ResourceId = {
        baseUrl: process.env.BASE_URL ?? '',
        path: `/${userId}`,
        orgId: '',
        role: '',
        extraData: '',
      };

      await window.litNodeClient.saveSigningCondition({
        accessControlConditions,
        chain,
        authSig,
        resourceId,
        permanant: false,
      });

      const accessParamsToSave = { resource_id: resourceId, access_control_conditions: accessControlConditions };
      // await supabase.from<User>('users').update({ access_params: accessParamsToSave }).eq('id', userId);

      toast.success('Access to your DECK was successfully setup.');
    } catch (e: any) {
      console.error(e);
      toast.error(`Provisioning access failed: ${e.errorCode && e.errorCode}`);
    }
  };

  // const verifyAccess = async (resourceId: ResourceId, accessControlConditions: AccessControlCondition[]) => {
  const verifyAccess = async () => {
    // TODO: requestedPath passed in from user when requesting to join a DECK
    // resourceId, accessControlConditions from DB
    const requestedPath = '';
    const resourceId = {
      baseUrl: process.env.BASE_URL ?? '',
      path: `/${requestedPath}`,
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
        body: JSON.stringify({ jwt, protectedPath: `/${userId}` }),
      });

      if (response.status !== 200) return;

      router.push('/app/protected');
    } catch (e: any) {
      console.error(e);
      toast.error(`Unable to verify access. ${e.errorCode && e.errorCode}`);
      // https://developer.litprotocol.com/docs/SDK/errorHandling
    }
  };

  return (
    <div className="container text-white">
      <main className="border border-gray-500 p-4 mt-48">
        <h1 className="mb-12">Decentralized and Encrypted Collaborative Knowledge</h1>

        {!accountData?.address && <Button onClick={() => connect(connectors[0])}>Connect wallet</Button>}
        {error && <div className="text-red-500">{error?.message ?? 'Failed to connect'}</div>}

        {accountData?.address && (
          <div className="flex flex-col w-52">
            <Link href="/app">
              <a>
                <Button className="w-full my-2">Use your DECK</Button>
              </a>
            </Link>

            <Button className="w-full my-2" onClick={() => setOpen(true)}>
              Share your DECK
            </Button>

            <Button className="w-full my-2" onClick={() => verifyAccess()}>
              Test Verification
            </Button>
          </div>
        )}

        {/* TODO: Join someone else's DECK
            before or after connecting wallet?
        */}

        {open && (
          <ShareModal
            onClose={() => setOpen(false)}
            onStringProvided={(providedString: string) => setStringToEncrypt(providedString)}
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
    </div>
  );
};

export default Home;
