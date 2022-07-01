import { useMemo, useState } from 'react';
import { IconFolderPlus, IconGitPullRequest, IconPencil, IconTrash } from '@tabler/icons';
import { toast } from 'react-toastify';
import useSWR from 'swr';
import supabase from 'lib/supabase';
import insertDeck from 'lib/api/insertDeck';
import selectDecks from 'lib/api/selectDecks';
import { Deck, Note } from 'types/supabase';
import { useAuth } from 'utils/useAuth';
import useHotkeys from 'utils/useHotkeys';
import { generateKey, encryptNote, encryptWithLit, decryptWithLit } from 'utils/encryption';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import createOnboardingNotes from 'utils/createOnboardingNotes';
import Button from 'components/home/Button';

export enum CreateJoinRenameDeckType {
  Create = 'create',
  Join = 'join',
  Rename = 'rename',
  Delete = 'delete',
  None = 'none',
}

type Props = {
  type: CreateJoinRenameDeckType;
  closeModal: () => void;
};

export default function CreateJoinRenameDeckModal(props: Props) {
  const { type, closeModal } = props;

  const { user } = useAuth();
  const { id: deckId, deck_name } = useCurrentDeck();
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

    const deckKey = generateKey();
    const accessControlConditions = [
      {
        contractAddress: '',
        standardContractType: '',
        chain: 'ethereum',
        method: '',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '=',
          value: user.id,
        },
      },
    ];
    const [encryptedStringBase64, encryptedSymmetricKeyBase64] = await encryptWithLit(deckKey, accessControlConditions);
    const accessParams = {
      encrypted_string: encryptedStringBase64,
      encrypted_symmetric_key: encryptedSymmetricKeyBase64,
      access_control_conditions: accessControlConditions,
    };

    const deck = await insertDeck({
      user_id: user.id,
      deck_name: inputText,
      author_only_notes: false,
      author_control_notes: false,
      access_params: accessParams,
    });
    if (!deck) {
      toast.error('There was an error creating the DECK');
      return;
    }

    const onboardingNotes = createOnboardingNotes();
    const upsertData = onboardingNotes.map(note =>
      encryptNote({ ...note, deck_id: deck.id, user_id: user.id, author_only: false }, deckKey),
    );

    await supabase.from<Note>('notes').upsert(upsertData);

    toast.success(`Successfully created ${deck.deck_name}`);
    setProcessing(false);
    closeModal();
    window.location.assign(`${process.env.BASE_URL}/app/${deck.id}`);
  };

  const renameDeck = async () => {
    if (!user || !deckId || !inputText) return;

    const { data, error } = await supabase.from<Deck>('decks').update({ deck_name: inputText }).eq('id', deckId).single();

    if (error || !data) {
      toast.error('There was an error updating the DECK');
      return;
    }

    toast.success(`Successfully renamed ${data.deck_name}`);
    setProcessing(false);
    closeModal();
    window.location.assign(`${process.env.BASE_URL}/app/${deckId}`);
  };

  const deleteDeck = async () => {
    if (!user || !deckId || !deck_name) return;

    try {
      await supabase.from<Note>('notes').delete().eq('deck_id', deckId);
      await supabase.from<Deck>('decks').delete().eq('id', deckId);

      const response = await fetch('/api/reset-recent-deck', { method: 'POST' });
      if (!response.ok) toast.error('There was an error deleting the DECK');

      toast.success(`Successfully deleted ${deck_name}`);
      setProcessing(false);
      closeModal();
      window.location.assign(`${process.env.BASE_URL}/app`);
    } catch (error) {
      toast.error('There was an error deleting the DECK');
    }
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

    const { data, error } = await supabase.from<Deck>('decks').select('access_params').eq('id', inputText).single();
    if (!data || error) {
      toast.error('Unable to verify access.');
      return;
    }

    try {
      const { encrypted_string, encrypted_symmetric_key, access_control_conditions } = data.access_params;
      const deckKey = await decryptWithLit(encrypted_string, encrypted_symmetric_key, access_control_conditions);
      if (!deckKey) {
        toast.error('Unable to verify access.');
        return;
      }

      await fetch('/api/verify-deck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ allowedDeck: inputText }),
      });

      toast.success('Access to DECK is granted.');
      setProcessing(false);
      closeModal();
      window.location.assign(`${process.env.BASE_URL}/app/${inputText}`);
    } catch (error) {
      toast.error('Unable to verify access.');
    }
  };

  if (type === CreateJoinRenameDeckType.None) return null;

  const headings = {
    [CreateJoinRenameDeckType.Create]: 'Create a new DECK',
    [CreateJoinRenameDeckType.Join]: 'Join a DECK',
    [CreateJoinRenameDeckType.Rename]: 'Rename this DECK',
    [CreateJoinRenameDeckType.Delete]: 'Delete this DECK',
  };
  const icons = {
    [CreateJoinRenameDeckType.Create]: <IconFolderPlus className="ml-4 mr-1 text-gray-200" size={32} />,
    [CreateJoinRenameDeckType.Join]: <IconGitPullRequest className="ml-4 mr-1 text-gray-200" size={32} />,
    [CreateJoinRenameDeckType.Rename]: <IconPencil className="ml-4 mr-1 text-gray-200" size={32} />,
    [CreateJoinRenameDeckType.Delete]: <IconTrash className="ml-4 mr-1 text-gray-200" size={32} />,
  };
  const placeholders = {
    [CreateJoinRenameDeckType.Create]: 'Enter DECK name',
    [CreateJoinRenameDeckType.Join]: 'Enter DECK ID',
    [CreateJoinRenameDeckType.Rename]: 'Enter new DECK name',
  };
  const onClickHandlers = {
    [CreateJoinRenameDeckType.Create]: createNewDeck,
    [CreateJoinRenameDeckType.Join]: verifyAccess,
    [CreateJoinRenameDeckType.Rename]: renameDeck,
    [CreateJoinRenameDeckType.Delete]: deleteDeck,
  };

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={closeModal} />
      <div className="flex justify-center px-6 max-h-screen-80 my-screen-10">
        <div className="flex flex-col z-30 w-full max-w-screen-sm rounded shadow-popover bg-gray-800 text-gray-200">
          <div className="flex items-center flex-shrink-0 w-full">
            {icons[type]}
            <span className="text-xl py-4 px-2 border-none rounded-tl rounded-tr focus:ring-0 bg-gray-800">{headings[type]}</span>
          </div>
          <div className="px-4 py-4 flex-1 w-full overflow-y-auto border-t rounded-bl rounded-br bg-gray-700 border-gray-700">
            {type !== CreateJoinRenameDeckType.Delete ? (
              <input
                type="text"
                className="w-full py-4 px-2 text-xl border-none rounded focus:ring-0 bg-gray-800 text-gray-200"
                placeholder={placeholders[type]}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                autoFocus
                autoComplete="off"
                maxLength={type === 'create' || type === 'rename' ? 20 : 40}
              />
            ) : (
              <>
                <div>Are you sure you want to delete this DECK?</div>
                <div className="flex my-2 m-[-4px] flex-wrap">
                  <span className="text-xs m-1 inline-block py-1 px-2.5 leading-none text-center align-baseline bg-gray-800 text-gray-300 rounded">
                    {deck_name}
                  </span>
                  <span className="text-xs m-1 inline-block py-1 px-2.5 leading-none text-center align-baseline bg-gray-800 text-gray-300 rounded">
                    {deckId}
                  </span>
                </div>
              </>
            )}
            <div className="flex space-x-8">
              <Button
                className={`my-4 ${processing ? 'bg-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-400' : ''}`}
                primary
                onClick={onClickHandlers[type]}
                disabled={processing}
                loading={processing}
              >
                {type}
              </Button>
              <Button className="my-4" onClick={closeModal}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
