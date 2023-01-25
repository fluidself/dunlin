import { ForwardedRef, forwardRef, HTMLAttributes, memo, useCallback, useMemo } from 'react';
import { IconChevronRight } from '@tabler/icons';
import classNames from 'classnames';
import { Deck } from 'types/supabase';
import supabase from 'lib/supabase';
import { store, useStore } from 'lib/store';
import { isMobile } from 'utils/device';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import useOnNoteLinkClick from 'editor/useOnNoteLinkClick';
import SidebarItem from './SidebarItem';
import SidebarNoteLinkDropdown from './SidebarNoteLinkDropdown';
import { FlattenedNoteTreeItem } from './SidebarNotesTree';

interface Props extends HTMLAttributes<HTMLDivElement> {
  node: FlattenedNoteTreeItem;
  isHighlighted?: boolean;
}

const SidebarNoteLink = (props: Props, forwardedRef: ForwardedRef<HTMLDivElement>) => {
  const { node, isHighlighted, className = '', style, ...otherProps } = props;

  const { id: deckId } = useCurrentDeck();
  const note = useStore(state => state.notes[node.id]);
  const setIsSidebarOpen = useStore(state => state.setIsSidebarOpen);
  const lastOpenNoteId = useStore(state => state.openNoteIds[state.openNoteIds.length - 1]);
  const { onClick: onNoteLinkClick } = useOnNoteLinkClick(lastOpenNoteId);

  const toggleNoteTreeItemCollapsed = useStore(state => state.toggleNoteTreeItemCollapsed);

  const onArrowClick = useCallback(async () => {
    toggleNoteTreeItemCollapsed(node.id);
    await supabase.from<Deck>('decks').update({ note_tree: store.getState().noteTree }).eq('id', deckId);
  }, [node, deckId, toggleNoteTreeItemCollapsed]);

  const leftMargin = useMemo(() => node.depth * 26, [node.depth]);
  const leftPadding = useMemo(() => (!node.depth ? 7 : 0) + (node.hasChildren ? 3 : 8), [node.depth, node.hasChildren]);

  const itemClassName = classNames(
    'flex items-center flex-1 py-1 rounded-sm overflow-hidden select-none overflow-ellipsis whitespace-nowrap hover:bg-gray-700 active:bg-gray-600',
    { 'bg-gray-700': isHighlighted },
    className,
  );

  if (!note || !note.title) return null;

  return (
    <SidebarItem
      ref={forwardedRef}
      className={`relative flex items-center overflow-x-hidden group focus:outline-none dark:hover:bg-gray-800 dark:active:bg-gray-800 ${className}`}
      style={style}
      {...otherProps}
    >
      <div
        role="button"
        className={itemClassName}
        onClick={e => {
          e.preventDefault();
          onNoteLinkClick(note.id, e.shiftKey);
          if (isMobile()) {
            setIsSidebarOpen(false);
          }
        }}
        style={{ marginLeft: `${leftMargin}px`, paddingLeft: `${leftPadding}px` }}
        draggable={false}
      >
        {node.hasChildren ? (
          <button
            className="p-0.5 rounded hover:bg-gray-300 active:bg-gray-400 dark:hover:bg-gray-600 dark:active:bg-gray-500"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onArrowClick?.();
            }}
          >
            <IconChevronRight
              className={`flex-shrink-0 text-gray-500 dark:text-gray-100 transform transition-transform ${
                !node.collapsed ? 'rotate-90' : ''
              }`}
              size={16}
            />
          </button>
        ) : null}
        <span className="overflow-hidden overflow-ellipsis whitespace-nowrap text-sm">{note?.title ?? ''}</span>
      </div>
      <SidebarNoteLinkDropdown note={note} className="opacity-0.1 group-hover:opacity-100 absolute right-0" />
    </SidebarItem>
  );
};

export default memo(forwardRef(SidebarNoteLink));
