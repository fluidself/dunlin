import { IconChevronsLeft, IconCopy } from '@tabler/icons';
import { useStore } from 'lib/store';
import copyToClipboard from 'utils/copyToClipboard';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { addEllipsis } from 'utils/string';
import Tooltip from 'components/Tooltip';

export default function Header() {
  const { deck } = useCurrentDeck();
  const setIsSidebarOpen = useStore(state => state.setIsSidebarOpen);

  return (
    <div className="relative">
      <div className="flex items-center justify-between w-full py-2 pl-6 overflow-x-hidden text-left text-gray-800  dark:text-gray-200  overflow-ellipsis whitespace-nowrap focus:outline-none cursor-default border-b border-gray-700">
        <div className="flex flex-col flex-1">
          <span className="mr-1 font-semibold select-none hero-decoration">DECK</span>
          {deck && (
            <div className="flex flex-row items-center">
              <span className="text-xs">{addEllipsis(deck.id)}</span>
              <button
                className="flex items-center text-gray-200 hover:bg-gray-600 hover:text-gray-200 ml-2 rounded p-1"
                onClick={async () => await copyToClipboard(deck.id)}
              >
                <IconCopy size={18} className="" />
              </button>
            </div>
          )}
        </div>
        <Tooltip content="Collapse sidebar (Ctrl+\)" placement="right">
          <span
            className="p-1 mr-2 rounded hover:bg-gray-300 active:bg-gray-400 dark:hover:bg-gray-600 dark:active:bg-gray-500 cursor-pointer"
            onClick={e => {
              e.stopPropagation();
              setIsSidebarOpen(false);
            }}
          >
            <IconChevronsLeft className="text-gray-500 dark:text-gray-400" />
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
