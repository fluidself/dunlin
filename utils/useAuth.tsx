import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Connector, useAccount, useConnect, useDisconnect, useNetwork, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { box } from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';
import { useSWRConfig } from 'swr';
import type { User } from 'types/supabase';

const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

interface ProviderRpcError extends Error {
  message: string;
  code: number;
  data?: unknown;
}

type AuthContextType = {
  isLoaded: boolean;
  user: User | null;
  signIn: (connector: Connector) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useProvideAuth(): AuthContextType {
  const { isConnected, address: activeAddress } = useAccount();
  const { chain: activeChain } = useNetwork();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { mutate } = useSWRConfig();
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const initUser = async () => {
    const res = await fetch('/api/user');
    const { user, token } = await res.json();
    localStorage.setItem('dbToken', token);

    setUser(user);
    setIsLoaded(true);
  };

  useEffect(() => {
    initUser();
  }, []);

  const signIn = useCallback(async (connector: Connector) => {
    setSigningIn(true);

    try {
      let address;
      let chainId;

      if (isConnected && activeAddress && activeChain) {
        address = activeAddress;
        chainId = activeChain.id;
      } else {
        const { account, chain } = await connectAsync({ connector });
        address = account;
        chainId = chain.id;
      }

      if (!address || !chainId) throw new Error('Unable to connect');

      const nonceResponse = await fetch('/api/nonce');
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to use Dunlin',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce: await nonceResponse.text(),
      });

      const messageBody = message.prepareMessage();
      const signature = await signMessageAsync({ message: messageBody });

      const verificationResponse = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, signature }),
      });
      if (!verificationResponse.ok) throw new Error('Error verifying message');

      localStorage.setItem(
        'lit-auth-signature',
        JSON.stringify({
          sig: signature,
          derivedVia: 'web3.eth.personal.sign',
          signedMessage: messageBody,
          address,
        }),
      );
      const commsKeyPair = box.keyPair();
      localStorage.setItem(
        'lit-comms-keypair',
        JSON.stringify({
          publicKey: encodeBase64(commsKeyPair.publicKey),
          secretKey: encodeBase64(commsKeyPair.secretKey),
        }),
      );

      await initUser();
      setSigningIn(false);
    } catch (e) {
      if ((e as ProviderRpcError).code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      console.error(e);
    }
  }, []);

  const signOut = async () => {
    await disconnectAsync();
    await fetch('/api/signout', { method: 'POST' });
    mutate('deck-with-notes', { optimisticData: undefined });
    localStorage.removeItem('lit-auth-signature');
    localStorage.removeItem('dbToken');
    setUser(null);
  };

  return {
    isLoaded: isLoaded && !signingIn,
    user,
    signIn,
    signOut,
  };
}

export function ProvideAuth({ children }: { children: ReactNode }) {
  const auth = useProvideAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a provider');
  }

  return context;
};
