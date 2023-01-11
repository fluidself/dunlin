import { useMemo, useState } from 'react';
import { IconFolderPlus, IconGitPullRequest, IconPencil, IconTrash, IconX } from '@tabler/icons';
import { useSWRConfig } from 'swr';
import { toast } from 'react-toastify';
import supabase from 'lib/supabase';
import insertDeck from 'lib/api/insertDeck';
import { Deck, Note } from 'types/supabase';
import { useAuth } from 'utils/useAuth';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import useHotkeys from 'utils/useHotkeys';
import { generateKey, encryptNote, encryptWithLit } from 'utils/encryption';
import createOnboardingNotes from 'utils/createOnboardingNotes';
import { verifyDeckAccess } from 'utils/accessControl';
import Button from 'components/Button';

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
  deckId?: string;
  deckName?: string;
};

export default function CreateJoinRenameDeckModal(props: Props) {
  const { type, closeModal, deckId, deckName } = props;
  const { mutate } = useSWRConfig();
  const { user } = useAuth();
  const { id: currentDeckId } = useCurrentDeck();
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

  const BASE_URL = process.env.BASE_URL as string;

  const createNewDeck = async () => {
    if (!user || !inputText) return;
    setProcessing(true);

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
      toast.error('There was an error creating the workspace');
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
    window.location.assign(`${BASE_URL}/app/${deck.id}`);
  };

  const renameDeck = async () => {
    if (!user || !deckId || !inputText) return;
    setProcessing(true);

    const { data, error } = await supabase
      .from<Deck>('decks')
      .update({ deck_name: inputText })
      .eq('id', deckId)
      .single();

    if (error || !data) {
      toast.error('There was an error updating the workspace');
      return;
    }

    mutate('decks');
    toast.success(`Successfully renamed ${data.deck_name}`);
    setProcessing(false);
    closeModal();
  };

  const deleteDeck = async () => {
    if (!user || !deckId || !deckName) return;
    setProcessing(true);

    try {
      const { error } = await supabase.from<Deck>('decks').delete().eq('id', deckId);
      if (error) toast.error('There was an error deleting the workspace');

      if (deckId === currentDeckId) {
        await fetch('/api/reset-recent-deck', { method: 'POST' });
      }

      mutate('decks');
      toast.success(`Successfully deleted ${deckName}`);
      setProcessing(false);
      closeModal();

      if (deckId === currentDeckId) {
        window.location.assign(BASE_URL);
      }
    } catch (error) {
      toast.error('There was an error deleting the workspace');
    }
  };

  const verifyAccess = async () => {
    if (!inputText || !user) return;
    setProcessing(true);

    const success = await verifyDeckAccess(inputText, user);

    if (success) {
      toast.success('Access to workspace is granted');
      setProcessing(false);
      closeModal();
      window.location.assign(`${BASE_URL}/app/${inputText}`);
    } else {
      toast.error('Unable to verify access');
      setProcessing(false);
    }
  };

  if (type === CreateJoinRenameDeckType.None) return null;

  const headings = {
    [CreateJoinRenameDeckType.Create]: 'Create a new workspace',
    [CreateJoinRenameDeckType.Join]: 'Join a workspace',
    [CreateJoinRenameDeckType.Rename]: 'Rename workspace',
    [CreateJoinRenameDeckType.Delete]: 'Delete workspace',
  };
  const icons = {
    [CreateJoinRenameDeckType.Create]: <IconFolderPlus className="ml-4 mr-1 text-gray-200" size={32} />,
    [CreateJoinRenameDeckType.Join]: <IconGitPullRequest className="ml-4 mr-1 text-gray-200" size={32} />,
    [CreateJoinRenameDeckType.Rename]: <IconPencil className="ml-4 mr-1 text-gray-200" size={32} />,
    [CreateJoinRenameDeckType.Delete]: <IconTrash className="ml-4 mr-1 text-gray-200" size={32} />,
  };
  const placeholders = {
    [CreateJoinRenameDeckType.Create]: 'Enter workspace name',
    [CreateJoinRenameDeckType.Join]: 'Enter workspace ID',
    [CreateJoinRenameDeckType.Rename]: 'Enter new workspace name',
  };
  const onClickHandlers = {
    [CreateJoinRenameDeckType.Create]: createNewDeck,
    [CreateJoinRenameDeckType.Join]: verifyAccess,
    [CreateJoinRenameDeckType.Rename]: renameDeck,
    [CreateJoinRenameDeckType.Delete]: deleteDeck,
  };

  const deckTags = () => (
    <div className="flex mb-2 m-[-4px] flex-wrap">
      <span className="text-xs m-1 inline-block py-1 px-2.5 leading-none text-center align-baseline bg-gray-900 text-gray-300 rounded">
        {deckName}
      </span>
      <span className="text-xs m-1 inline-block py-1 px-2.5 leading-none text-center align-baseline bg-gray-900 text-gray-300 rounded">
        {deckId}
      </span>
    </div>
  );

  const renderModalContent = () => {
    switch (type) {
      case CreateJoinRenameDeckType.Delete:
        return (
          <>
            <div className="mb-2">Are you sure you want to delete this workspace?</div>
            {deckTags()}
          </>
        );
      case CreateJoinRenameDeckType.Rename:
        return (
          <>
            {deckTags()}
            <input
              type="text"
              className="w-full py-3 px-2 text-xl border-none rounded focus:ring-0 bg-gray-900 text-gray-200"
              placeholder={placeholders[type]}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              autoFocus
              autoComplete="off"
              maxLength={20}
            />
          </>
        );
      default:
        return (
          <input
            type="text"
            className="w-full py-3 px-2 text-xl border-none rounded focus:ring-0 bg-gray-900 text-gray-200"
            placeholder={placeholders[type]}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            autoFocus
            autoComplete="off"
            maxLength={type === 'create' ? 20 : 40}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={closeModal} />
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col z-30 w-full max-w-screen-sm rounded shadow-popover bg-gray-900 text-gray-200 border border-gray-600">
          <div className="flex items-center justify-between flex-shrink-0 w-full">
            <div className="flex items-center">
              {icons[type]}
              <span className="text-xl py-4 px-2 border-none rounded-tl rounded-tr focus:ring-0 bg-gray-900">
                {headings[type]}
              </span>
            </div>
            <button className="mb-6 mr-2 text-gray-300 hover:text-gray-100" onClick={closeModal}>
              <IconX size={20} />
            </button>
          </div>
          <div className="px-4 py-4 flex-1 w-full overflow-y-auto border-t rounded-bl rounded-br bg-gray-800 border-gray-700">
            {renderModalContent()}
            <div className="flex space-x-4 justify-end mt-4">
              <Button
                className={`${processing ? 'bg-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-400' : ''}`}
                primary
                onClick={onClickHandlers[type]}
                disabled={processing}
                loading={processing}
              >
                {type}
              </Button>
              <Button onClick={closeModal}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
