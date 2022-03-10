import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
// import Navbar from '../components/Navbar';
import { ShareModal } from '../components/ShareModal';
import Button from '../components/Button';

const Home: NextPage = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [selectedConditions, setSelectedConditions] = useState(null);

  return (
    <>
      <Head>
        <title>DECK</title>
        <meta name="description" content="Decentralized and Encrypted Collaborative Knowledge" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container text-white">
        {/* <Navbar /> */}
        <main className="border border-gray-500 p-4 mt-48">
          <h1 className="mb-12">Decentralized and Encrypted Collaborative Knowledge</h1>
          {/* <button>Connect wallet</button> */}
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
    </>
  );
};

export default Home;
