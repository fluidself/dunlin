import { useEffect, useState } from 'react';
import type { Client } from '@web3-storage/w3up-client';
import { createClient } from 'utils/web3-storage';

export default function useIpfs() {
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    const initClient = async () => {
      const client = await createClient();
      setClient(client);
    };

    initClient();
  }, []);

  return client;
}
