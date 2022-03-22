// @ts-ignore
import LitJsSdk from 'lit-js-sdk';
import { useMemo, useState } from 'react';
import { IconFolderPlus, IconGitPullRequest } from '@tabler/icons';
import { toast } from 'react-toastify';
import useSWR from 'swr';
import supabase from 'lib/supabase';
import insertDeck from 'lib/api/insertDeck';
import selectDecks from 'lib/api/selectDecks';
import { Deck } from 'types/supabase';
import { useAuth } from 'utils/useAuth';
import { AuthSig } from 'types/lit';
import useHotkeys from 'utils/useHotkeys';
import Button from 'components/home/Button';

type Props = {
  type: 'create' | 'join';
  closeModal: () => void;
};

export default function CreateOrJoinDeckModal(props: Props) {
  const { type, closeModal } = props;

  const { user } = useAuth();
  const { data: decks } = useSWR(user ? 'decks' : null, () => selectDecks(user?.id), { revalidateOnFocus: false });
  const [inputText, setInputText] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);

  const hotkeys = useMemo(
    () => [
      {
        hotkey: 'esc',
        callback: () => closeModal(),
      },
    ],
    [closeModal],
  );
  useHotkeys(hotkeys);

  const createNewDeck = async () => {
    if (!user || !inputText) return;

    const deck = await insertDeck({ user_id: user.id, deck_name: inputText });

    if (!deck) {
      toast.error('There was an error creating the DECK');
      return;
    }

    toast.success(`Successfully created ${deck.deck_name}`);
    setProcessing(false);
    closeModal();
    window.location.assign(`${process.env.BASE_URL}/app/${deck.id}`);
  };

  const verifyAccess = async () => {
    if (!inputText) return;

    if (decks?.find(deck => deck.id === inputText)) {
      toast.success('You own that DECK!');
      setProcessing(false);
      closeModal();
      window.location.assign(`${process.env.BASE_URL}/app/${inputText}`);
      return;
    }

    const { data: accessParams } = await supabase.from<Deck>('decks').select('access_params').eq('id', inputText).single();
    if (!accessParams?.access_params) {
      toast.error('Unable to verify access.');
      return;
    }

    const { resource_id: resourceId, access_control_conditions: accessControlConditions } = accessParams?.access_params || {};
    if (!resourceId || !accessControlConditions || !accessControlConditions[0].chain) {
      toast.error('Unable to verify access.');
      return;
    }

    try {
      const chain = accessControlConditions[0].chain;
      const authSig: AuthSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
      const jwt = await window.litNodeClient.getSignedToken({
        accessControlConditions,
        chain,
        authSig,
        resourceId,
      });

      const response = await fetch('/api/verify-jwt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jwt, requestedDeck: inputText }),
      });

      if (!response.ok) return;

      toast.success('Access to DECK is granted.');
      setProcessing(false);
      closeModal();
      window.location.assign(`${process.env.BASE_URL}/app/${inputText}`);
    } catch (e: any) {
      console.error(e);
      toast.error('Unable to verify access.');
    }
  };

  const title = type === 'create' ? 'Create a new DECK' : 'Join a DECK';
  const icon =
    type === 'create' ? (
      <IconFolderPlus className="ml-4 mr-1 text-gray-200" size={32} />
    ) : (
      <IconGitPullRequest className="ml-4 mr-1 text-gray-200" size={32} />
    );

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={closeModal} />
      <div className="flex justify-center px-6 max-h-screen-80 my-screen-10">
        <div className="flex flex-col z-30 w-full max-w-screen-sm rounded shadow-popover bg-gray-800 text-gray-200">
          <div className="flex items-center flex-shrink-0 w-full">
            {icon}
            <span className="text-xl py-4 px-2 border-none rounded-tl rounded-tr focus:ring-0 bg-gray-800">{title}</span>
          </div>
          <div className="px-4 py-4 flex-1 w-full overflow-y-auto border-t rounded-bl rounded-br bg-gray-700 border-gray-700">
            <input
              type="text"
              className="w-full py-4 px-2 text-xl border-none rounded-tl rounded-tr focus:ring-0 bg-gray-800 text-gray-200"
              placeholder={type === 'create' ? 'Enter DECK name' : 'Enter DECK ID'}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              autoFocus
              autoComplete="off"
              maxLength={type === 'create' ? 20 : 40}
            />
            <Button
              className={`my-4 ${processing ? 'bg-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-400' : ''}`}
              primary
              onClick={() => (type === 'create' ? createNewDeck() : verifyAccess())}
              disabled={processing}
              loading={processing}
            >
              {type === 'create' ? 'Create' : 'Join'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
