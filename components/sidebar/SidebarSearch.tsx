import { memo, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Highlighter from 'react-highlight-words';
import type { FuseResultMatch } from 'fuse.js';
import useNoteSearch, { NoteBlock } from 'utils/useNoteSearch';
import useDebounce from 'utils/useDebounce';
import { useStore } from 'lib/store';
import ErrorBoundary from '../ErrorBoundary';
import VirtualTree from '../VirtualTree';

const DEBOUNCE_MS = 500;

export default function SidebarSearch() {
  const deckId = useStore(state => state.deckId);
  const inputText = useStore(state => state.sidebarSearchQuery);
  const isSidebarOpen = useStore(state => state.isSidebarOpen);
  const setInputText = useStore(state => state.setSidebarSearchQuery);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [searchQuery, setSearchQuery] = useDebounce(inputText, DEBOUNCE_MS);
  const search = useNoteSearch({ searchContent: true, extendedSearch: true });

  useEffect(() => {
    if (isSidebarOpen) {
      const handler = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(handler);
    }
  }, [isSidebarOpen]);

  const searchResultsData = useMemo(() => {
    const searchResults = search(searchQuery);
    return searchResults.map(result => ({
      id: result.item.id,
      labelNode: <SidebarSearchBranch text={result.item.title} />,
      children: result.matches
        ? [...result.matches].sort(matchSort).map((match, index) => ({
            id: `${result.item.id}-${index}`,
            labelNode: (
              <SidebarSearchLeaf
                deckId={deckId}
                noteId={result.item.id}
                text={match.value ?? ''}
                searchQuery={searchQuery}
                block={
                  result.item.blocks && match.refIndex !== undefined ? result.item.blocks[match.refIndex] : undefined
                }
              />
            ),
            showArrow: false,
          }))
        : undefined,
    }));
  }, [search, searchQuery, deckId]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <input
          type="text"
          className="block py-1 mx-4 my-2 bg-white border-gray-200 rounded dark:bg-gray-700 dark:border-gray-700 input"
          placeholder="Search notes"
          value={inputText}
          ref={inputRef}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setSearchQuery(inputText);
            }
          }}
        />
        {!searchQuery || searchResultsData.length > 0 ? (
          <VirtualTree className="flex-1 px-1 overflow-y-auto" data={searchResultsData} />
        ) : (
          <p className="px-4 text-gray-600">No results found.</p>
        )}
      </div>
    </ErrorBoundary>
  );
}

type SidebarSearchBranchProps = {
  text: string;
};

const SidebarSearchBranch = memo(function SidebarSearchBranch(props: SidebarSearchBranchProps) {
  const { text } = props;
  return <p className="py-1 overflow-hidden overflow-ellipsis whitespace-nowrap dark:text-gray-200">{text}</p>;
});

type SidebarSearchLeafProps = {
  deckId: string;
  noteId: string;
  text: string;
  searchQuery: string;
  block?: NoteBlock;
};

const SidebarSearchLeaf = memo(function SidebarSearchLeaf(props: SidebarSearchLeafProps) {
  const { deckId, noteId, text, searchQuery, block } = props;
  const router = useRouter();
  return (
    <button
      className="w-full text-left rounded hover:bg-gray-200 active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600"
      onClick={() => {
        const hash = block ? `#0-${block.path}` : '';
        router.push(`/app/${deckId}/note/${noteId}${hash}`);
      }}
    >
      <Highlighter
        className="block px-1 py-2 text-xs text-gray-600 break-words dark:text-gray-300"
        highlightClassName="bg-yellow-200 text-gray-600 dark:bg-[#828324] dark:text-gray-100"
        searchWords={searchQuery.split(' ')}
        autoEscape={true}
        textToHighlight={text}
      />
    </button>
  );
});

const matchSort = (a: FuseResultMatch, b: FuseResultMatch) => {
  if (a.refIndex === undefined && b.refIndex === undefined) {
    return 0;
  } else if (a.refIndex === undefined) {
    return -1;
  } else if (b.refIndex === undefined) {
    return 1;
  } else {
    return a.refIndex - b.refIndex;
  }
};
