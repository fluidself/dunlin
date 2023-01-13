import LitJsSdk from 'lit-js-sdk';
import { useEffect, useMemo, useState } from 'react';
import useIsMounted from 'utils/useIsMounted';

export default function useLitProtocol() {
  const isMounted = useIsMounted();
  const [isReady, setIsReady] = useState(false);
  const [isError, setIsError] = useState(false);

  const client = useMemo(
    () =>
      new LitJsSdk.LitNodeClient({
        alertWhenUnauthorized: false,
        debug: false,
      }),
    [],
  );

  useEffect(() => {
    const initLit = async () => {
      try {
        await client.connect();
        window.litNodeClient = client;
        setIsReady(true);
      } catch (error) {
        setIsError(true);
      }
    };

    if (window.litNodeClient) {
      setIsReady(true);
    } else if (isMounted()) {
      initLit();
    }
  }, [isMounted]);

  return { isReady, isError };
}
