import { useMemo } from 'react';
import { Web3Storage } from 'web3.storage';

const WEB3STORAGE_TOKEN = process.env.NEXT_PUBLIC_WEB3STORAGE_TOKEN as string;

export default function useIpfs() {
  const client = useMemo(() => new Web3Storage({ token: WEB3STORAGE_TOKEN, endpoint: new URL('https://api.web3.storage') }), []);

  return client;
}
