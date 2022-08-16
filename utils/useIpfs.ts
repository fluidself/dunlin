import { useMemo } from 'react';
import { Web3Storage } from 'web3.storage';

const TOKEN = process.env.NEXT_PUBLIC_WEB3STORAGE_TOKEN as string;
const ENDPOINT = process.env.NEXT_PUBLIC_WEB3STORAGE_ENDPOINT as string;

export default function useIpfs() {
  const client = useMemo(() => new Web3Storage({ token: TOKEN, endpoint: new URL(ENDPOINT) }), []);

  return client;
}
