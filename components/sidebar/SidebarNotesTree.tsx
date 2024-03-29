import { useState, useMemo, useCallback, memo, CSSProperties } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useRouter } from 'next/router';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { toast } from 'react-toastify';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { NoteTreeItem, store, useStore } from 'lib/store';
import Portal from 'components/Portal';
import supabase from 'lib/supabase';
import { Deck } from 'types/supabase';
import SidebarNoteLink from './SidebarNoteLink';
import DraggableSidebarNoteLink from './DraggableSidebarNoteLink';

export type FlattenedNoteTreeItem = {
  id: string;
  depth: number;
  collapsed: boolean;
  hasChildren: boolean;
};

type Props = {
  data: NoteTreeItem[];
  className?: string;
};

function SidebarNotesTree(props: Props) {
  const { data, className } = props;

  const router = useRouter();
  const { id: deckId } = useCurrentDeck();

  const currentNoteId = useMemo(() => {
    const id = router.query.id;
    return id && typeof id === 'string' ? id : undefined;
  }, [router]);

  const notes = useStore(state => state.notes);
  const moveNoteTreeItem = useStore(state => state.moveNoteTreeItem);

  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );

  const flattenNode = useCallback(
    (node: NoteTreeItem, depth: number, result: FlattenedNoteTreeItem[]) => {
      const { id, children, collapsed } = node;
      result.push({ id, depth, collapsed, hasChildren: children.length > 0 });

      /**
       * Only push in children if:
       * 1. The node is not collapsed
       * 2. The node has children
       * 3. The node is not the active node (i.e. being dragged)
       */
      if (!collapsed && children.length > 0 && node.id !== activeId) {
        for (const child of children) {
          flattenNode(child, depth + 1, result);
        }
      }
    },
    [activeId],
  );

  const flattenedData = useMemo(() => {
    const result: FlattenedNoteTreeItem[] = [];
    for (const node of data) {
      if (!notes[node.id]) {
        continue;
      }
      flattenNode(node, 0, result);
    }
    return result;
  }, [data, notes, flattenNode]);

  const resetState = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id.toString());
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && deckId) {
        moveNoteTreeItem(active.id.toString(), over.id.toString());
        await supabase.from<Deck>('decks').update({ note_tree: store.getState().noteTree }).eq('id', deckId);
      } else {
        toast.error('There was an unexpected error: you are not logged in and your changes could not be saved.');
      }

      resetState();
    },
    [resetState, moveNoteTreeItem, deckId],
  );

  const Row = useCallback(
    ({ index, style }: { index: number; style: CSSProperties }) => {
      const node = flattenedData[index];
      return (
        <DraggableSidebarNoteLink key={node.id} node={node} isHighlighted={node.id === currentNoteId} style={style} />
      );
    },
    [currentNoteId, flattenedData],
  );

  return (
    <div className={className}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={flattenedData} strategy={verticalListSortingStrategy}>
          <AutoSizer>
            {({ width, height }: { width: number; height: number }) => (
              <List width={width} height={height} itemCount={flattenedData.length} itemSize={30}>
                {Row}
              </List>
            )}
          </AutoSizer>
        </SortableContext>
        <Portal>
          <DragOverlay>
            {activeId ? (
              <SidebarNoteLink
                node={
                  flattenedData.find(node => node.id === activeId) ?? {
                    id: activeId,
                    depth: 0,
                    collapsed: false,
                    hasChildren: false,
                  }
                }
              />
            ) : null}
          </DragOverlay>
        </Portal>
      </DndContext>
    </div>
  );
}

export default memo(SidebarNotesTree);
