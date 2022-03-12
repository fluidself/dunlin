import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useConnect } from 'wagmi';
import { ShareModal } from 'components/ShareModal';
import Button from 'components/Button';

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
    } else if (isLoaded) {
      router.push('/app');
    }
  }, [accountData?.address, isLoaded]);

  return (
    <div className="container text-white">
      <main className="border border-gray-500 p-4 mt-48">
        <h1 className="mb-12">Decentralized and Encrypted Collaborative Knowledge</h1>
        <Button onClick={() => connect(connectors[0])}>Connect wallet</Button>
        {error && <div className="text-red-500">{error?.message ?? 'Failed to connect'}</div>}
        <Button onClick={() => setOpen(true)}>Open Modal</Button>

        {open && (
          <ShareModal
            onClose={() => setOpen(false)}
            onAccessControlConditionsSelected={(acc: any) => {
              console.log('Access control conditions selected: ', acc);
              setSelectedConditions(acc);
              setOpen(false);
            }}
            // showStep={'whatToDo'}
            showStep={'ableToAccess'}
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
