import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useConnect } from 'wagmi';
import { IconWallet, IconX } from '@tabler/icons';
import useHotkeys from 'utils/useHotkeys';
import { useAuth } from 'utils/useAuth';
import selectDecks from 'lib/api/selectDecks';
import { ConnectorIcons } from './ConnectorIcons';

type Props = {
  onClose: () => void;
  redirectToOnboarding?: () => void;
};

export default function ConnectModal(props: Props) {
  const { onClose, redirectToOnboarding } = props;
  const router = useRouter();
  const { connectors } = useConnect();
  const { user, signIn } = useAuth();

  const hotkeys = useMemo(
    () => [
      {
        hotkey: 'esc',
        callback: () => onClose(),
      },
    ],
    [onClose],
  );
  useHotkeys(hotkeys);

  useEffect(() => {
    const onboardUser = async (userId: string) => {
      const decks = await selectDecks(userId, localStorage.getItem('dbToken') ?? '');
      if (decks.length) {
        router.push(`/app/${decks[decks.length - 1].id}`);
      } else {
        onClose();
        redirectToOnboarding?.();
      }
    };

    if (user && redirectToOnboarding) {
      onboardUser(user.id);
    } else if (user) {
      onClose();
    }
  }, [user, router, onClose, redirectToOnboarding]);

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={onClose} />
      <div className="flex items-center justify-center h-screen">
        <div className="z-30 flex flex-col w-full h-full max-w-full overflow-hidden bg-gray-900 rounded sm:max-h-128 sm:w-[605px] shadow-popover border border-gray-600 text-center pb-8">
          <div className="flex justify-end items-center pr-2 pt-1">
            <button className="mr-[-4px] text-gray-300 hover:text-gray-100" onClick={onClose}>
              <IconX size={20} />
            </button>
          </div>
          <h2 className="text-3xl my-12 font-heading tracking-wider">Connect wallet</h2>
          <div className="flex flex-col gap-6 items-center">
            {connectors.map(connector => {
              const ConnectorIcon = ConnectorIcons[connector.id];
              return (
                <button
                  className={`flex items-center justify-between w-1/2 py-2 px-4 rounded border border-gray-700 ${
                    !connector.ready ? 'cursor-not-allowed' : 'hover:bg-gray-800 focus:bg-gray-800'
                  }`}
                  disabled={!connector.ready}
                  key={connector.id}
                  onClick={async () => await signIn(connector)}
                >
                  {connector.name}
                  <ConnectorIcon className="h-7 w-7" />
                </button>
              );
            })}
            <button
              className="flex items-center justify-between w-1/2 py-2 px-4 rounded hover:bg-gray-800 focus:bg-gray-800 border border-gray-700"
              onClick={() =>
                window.open('https://ethereum.org/en/wallets/find-wallet/', '_blank', 'noopener noreferrer')
              }
            >
              I don&apos;t have a wallet
              <IconWallet size={26} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
