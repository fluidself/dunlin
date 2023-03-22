import useSWR, { useSWRConfig } from 'swr';
import { IconPencil, IconTrash } from '@tabler/icons';
import { Contributor } from 'types/supabase';
import supabase from 'lib/supabase';
import selectDecks from 'lib/api/selectDecks';
import { useAuth } from 'utils/useAuth';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { CreateJoinRenameDeckType } from 'components/CreateJoinRenameDeckModal';

type Props = {
  setCreateJoinRenameModal: (modalStatus: {
    open: boolean;
    type: CreateJoinRenameDeckType;
    deckId: string;
    deckName: string;
  }) => void;
};

export default function DeckManagement(props: Props) {
  const { setCreateJoinRenameModal } = props;
  const { id: currentDeckId } = useCurrentDeck();
  const { user } = useAuth();
  const { data: decks } = useSWR(user ? 'decks' : null, () => selectDecks(user?.id), { revalidateOnFocus: false });
  const { mutate } = useSWRConfig();

  const forgetDeck = async (deckId: string) => {
    try {
      await supabase.from<Contributor>('contributors').delete().match({ deck_id: deckId, user_id: user?.id }).single();
      mutate('decks');

      if (deckId === currentDeckId) {
        await fetch('/api/reset-recent-deck', { method: 'POST' });
        window.location.assign(process.env.BASE_URL as string);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const renderDecks = () => {
    if (!user || !decks) {
      return null;
    }

    return (
      <table className="table-auto w-full text-sm dark:text-gray-300">
        <thead>
          <tr className="border-b border-gray-300 dark:border-gray-600">
            <th className="py-3 pl-2 text-left">Name</th>
            <th className="py-3 text-left">ID</th>
            <th className="py-3"></th>
            <th className="py-3"></th>
          </tr>
        </thead>
        <tbody>
          {decks.map(deck => (
            <tr key={deck.id} className="border-b border-gray-300 dark:border-gray-600">
              <td className="py-3 pl-2">{deck.deck_name}</td>
              <td className="py-3">{deck.id}</td>
              <td className="py-3">
                {deck.user_id === user.id && (
                  <button
                    className="flex items-center relative px-1 focus:outline-none settings-modal-tooltip"
                    onClick={() =>
                      setCreateJoinRenameModal({
                        open: true,
                        type: CreateJoinRenameDeckType.Rename,
                        deckId: deck.id,
                        deckName: deck.deck_name,
                      })
                    }
                  >
                    <IconPencil size={20} />
                    <span className="bg-gray-600 text-gray-100 rounded z-10 px-1.5 py-1 absolute invisible tooltiptext">
                      Rename
                    </span>
                  </button>
                )}
              </td>
              <td className="py-3">
                {deck.user_id === user.id ? (
                  <button
                    className="flex items-center relative px-1 focus:outline-none settings-modal-tooltip"
                    onClick={() =>
                      setCreateJoinRenameModal({
                        open: true,
                        type: CreateJoinRenameDeckType.Delete,
                        deckId: deck.id,
                        deckName: deck.deck_name,
                      })
                    }
                  >
                    <IconTrash size={20} />
                    <span className="bg-gray-600 text-gray-100 rounded z-10 px-1.5 py-1 absolute invisible tooltiptext">
                      Delete
                    </span>
                  </button>
                ) : (
                  <button
                    className="flex items-center relative px-1 focus:outline-none settings-modal-tooltip"
                    onClick={() => forgetDeck(deck.id)}
                  >
                    <IconTrash size={20} />
                    <span className="bg-gray-600 text-gray-100 rounded z-10 px-1.5 py-1 absolute invisible tooltiptext">
                      Forget
                    </span>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="flex-1 w-full h-full p-6 overflow-y-auto dark:bg-gray-900 dark:text-gray-100">
      <div className="mb-4">
        <h2 className="text-lg font-medium">Manage your workspaces</h2>
      </div>
      <div className="w-full">{renderDecks()}</div>
    </div>
  );
}
