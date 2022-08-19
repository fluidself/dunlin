import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useConnect } from 'wagmi';
import { SiweMessage } from 'siwe';
import { box } from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';
import { User } from 'types/supabase';

type AuthContextType = {
  isLoaded: boolean;
  user: User | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useProvideAuth(): AuthContextType {
  const [
    {
      data: { connectors },
    },
    connect,
  ] = useConnect();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const initUser = async () => {
    const res = await fetch('/api/user');
    const { user } = await res.json();

    setUser(user);
    setIsLoaded(true);
  };

  useEffect(() => {
    initUser();
  }, []);

  const signIn = useCallback(async () => {
    setSigningIn(true);

    try {
      const connector = connectors[0];
      const res = await connect(connector);
      if (!res.data) throw res.error ?? new Error('Unable to connect');

      const address = res.data.account;
      const nonceResponse = await fetch('/api/nonce');
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to use DECK',
        uri: window.location.origin,
        version: '1',
        chainId: res.data.chain?.id,
        nonce: await nonceResponse.text(),
      });

      const signer = await connector.getSigner();
      const messageBody = message.prepareMessage();
      const signature = await signer.signMessage(messageBody);

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
      console.error(e);
    }
  }, []);

  const signOut = async () => {
    await fetch('/api/signout', {
      method: 'POST',
    });
    localStorage.removeItem('lit-auth-signature');
    setUser(null);
    router.push('/');
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
