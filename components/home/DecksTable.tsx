import Link from 'next/link';
import { IconCopy } from '@tabler/icons';
import { Deck } from 'types/supabase';
import copyToClipboard from 'utils/copyToClipboard';
import Button from './Button';

type DecksTableProps = {
  decks: Deck[];
  onShareClick: (arg0: string) => void;
};

export default function DecksTable(props: DecksTableProps) {
  const { decks, onShareClick } = props;

  return (
    <table className="border-collapse table-auto w-full text-sm">
      <thead>
        <tr>
          <th className="border-b border-gray-500 font-medium p-4 pl-8 pt-0 pb-3 text-left">DECK ID</th>
          <th className="border-b border-gray-500 font-medium p-4 pt-0 pb-3 text-left">NAME</th>
          <th className="border-b border-gray-500 font-medium p-4 pt-0 pb-3 pr-1 text-left"></th>
          <th className="border-b border-gray-500 font-medium p-4 pt-0 pb-3 pr-0 text-left"></th>
        </tr>
      </thead>
      <tbody>
        {decks.map((deck: Deck) => (
          <tr key={deck.id}>
            <td className="border-b border-gray-500 p-4 pl-8">
              <span className="inline-flex items-center">
                {deck.id}
                <button className="hover:text-gray-400 ml-2 rounded p-1" onClick={async () => await copyToClipboard(deck.id)}>
                  <IconCopy />
                </button>
              </span>
            </td>
            <td className="border-b border-gray-500 p-4">{deck.deck_name}</td>
            <td className="border-b border-gray-500 pl-1 py-4 pr-6">
              <Link href={`/app/${deck.id}`}>
                <a
                  role="button"
                  className="py-1 px-2 flex items-center justify-center rounded uppercase border border-gray-500 text-gray-300 hover:border-white hover:text-white"
                >
                  Use
                </a>
              </Link>
            </td>
            <td className="border-b border-gray-500 pl-1 py-4 pr-0">
              <button
                className="py-1 px-6 flex items-center justify-center rounded uppercase border border-gray-500 text-gray-300 hover:border-white hover:text-white"
                onClick={() => onShareClick(deck.id)}
              >
                Share
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
