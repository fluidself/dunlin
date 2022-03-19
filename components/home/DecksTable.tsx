import Link from 'next/link';
import { IconShare, IconRocket, IconPencil } from '@tabler/icons';
import { Deck } from 'types/supabase';

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
          <th className="border-b border-gray-300 font-medium p-4 pl-8 pt-0 pb-3 text-left">DECK id</th>
          <th className="border-b border-gray-300 font-medium p-4 pt-0 pb-3 text-left">Name</th>
          <th className="border-b border-gray-300 font-medium p-4 pt-0 pb-3 pr-1 text-left"></th>
          <th className="border-b border-gray-300 font-medium p-4 pt-0 pb-3 pr-1 text-left"></th>
        </tr>
      </thead>
      <tbody>
        {decks.map((deck: Deck) => (
          <tr key={deck.id}>
            <td className="border-b border-gray-300 p-4 pl-8">{deck.id}</td>
            <td className="border-b border-gray-300 p-4">{deck.deck_name}</td>
            <td className="border-b border-gray-300 pl-1 py-4 pr-0">
              <Link href={`/app/${deck.id}`}>
                <a className="flex items-center hover:text-primary-500">
                  <IconRocket size={20} className="mr-1" />
                  Use
                </a>
              </Link>
            </td>
            <td className="border-b border-gray-300 pl-1 py-4 pr-0">
              <button className="flex items-center hover:text-primary-500" onClick={() => onShareClick(deck.id)}>
                <IconShare size={20} className="mr-1" />
                Share
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
