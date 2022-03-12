// @ts-ignore
import LitJsSdk from 'lit-js-sdk';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useConnect } from 'wagmi';
import { ShareModal } from 'components/ShareModal';
import Button from 'components/Button';
import useIsMounted from 'utils/useIsMounted';
import { useIpfsUpload } from 'utils/useIpfs';
import supabase from 'lib/supabase';
import { User } from 'types/supabase';
import { AccessControlCondition, AuthSig } from 'types/lit';

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
  const [selectedConditions, setSelectedConditions] = useState(null);
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

  const encryptString = async (accessControlConditions: AccessControlCondition[]) => {
    // TODO: some kind of loading indicator spinner / feedback toasts
    const userId = accountData?.address;
    if (!userId) return;

    const chain = accessControlConditions[0].chain;
    const authSig: AuthSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
    const { encryptedZip, symmetricKey } = await LitJsSdk.zipAndEncryptString('foobar'); // TODO: dynamic
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
    const userId = '0x209054D6337f6B147a7c38C73618e05f3770466e';
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
          </div>
        )}

        {open && (
          <ShareModal
            onClose={() => setOpen(false)}
            onAccessControlConditionsSelected={async (acc: any) => {
              console.log('Access control conditions selected: ', acc);
              setSelectedConditions(acc);
              setOpen(false);
              await encryptString(acc);
            }}
            showStep={'ableToAccess'}
            // showStep={'setPassword'}
          />
        )}

        {selectedConditions ? (
          <>
            <h3>Selected conditions: </h3>
            <pre>{JSON.stringify(selectedConditions, null, 2)}</pre>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default Home;
