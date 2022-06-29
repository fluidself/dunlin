import { memo, useMemo, useEffect } from 'react';
import { createEditor } from 'slate';
import { Editable, Slate, withReact } from 'slate-react';
import { SyncElement, toSharedType, withYjs, withCursor, useCursors } from 'slate-yjs';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import randomColor from 'randomcolor';
import withVoidElements from 'editor/plugins/withVoidElements';
import withLinks from 'editor/plugins/withLinks';
import withTags from 'editor/plugins/withTags';
import withImages from 'editor/plugins/withImages';
import withNormalization from 'editor/plugins/withNormalization';
import { getDefaultEditorValue } from 'editor/constants';
import { DeckEditor } from 'types/slate';
import { useStore } from 'lib/store';
import { useAuth } from 'utils/useAuth';
import { addEllipsis } from 'utils/string';
import withVerticalSpacing from './elements/withVerticalSpacing';
import EditorElement from './elements/EditorElement';
import EditorLeaf from './elements/EditorLeaf';

type Props = {
  noteId: string;
  className: string;
};

const WEBSOCKET_ENDPOINT =
  process.env.NODE_ENV === 'development' ? 'ws://localhost:1234' : (process.env.NEXT_PUBLIC_Y_WEBSOCKET_ENDPOINT as string);

function ReadOnlyNoteEditor(props: Props) {
  const { noteId, className } = props;
  const { user } = useAuth();

  const value = useStore(store => store.notes[noteId].content ?? getDefaultEditorValue());

  const color = useMemo(
    () =>
      randomColor({
        luminosity: 'dark',
        format: 'rgba',
        alpha: 1,
      }),
    [],
  );

  const [sharedType, provider] = useMemo(() => {
    const doc = new Y.Doc();
    const sharedType = doc.getArray<SyncElement>('content');
    const provider = new WebsocketProvider(WEBSOCKET_ENDPOINT, noteId, doc, {
      connect: false,
    });

    return [sharedType, provider];
  }, [noteId]);

  const editor = useMemo(() => {
    const editor = withCursor(
      withYjs(
        withNormalization(withVoidElements(withImages(withTags(withLinks(withReact(createEditor() as DeckEditor)))))),
        sharedType,
      ),
      provider.awareness,
    );

    return editor;
  }, [sharedType, provider]);

  const { decorate } = useCursors(editor);

  useEffect(() => {
    provider.on('sync', (isSynced: boolean) => {
      if (isSynced && sharedType.length === 0) {
        toSharedType(sharedType, value);
      }
    });

    provider.awareness.setLocalState({
      alphaColor: color.slice(0, -2) + '0.2)',
      color,
      name: user ? addEllipsis(user.id) : 'Anonymous',
    });

    provider.connect();

    return () => {
      provider.awareness.destroy();
      provider.disconnect();
    };
    // eslint-disable-next-line
  }, [provider]);

  const renderElement = useMemo(() => {
    const ElementWithVerticalSpacing = withVerticalSpacing(EditorElement);
    return ElementWithVerticalSpacing;
  }, []);

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={() => {
        /* Do nothing, this is a read only editor */
      }}
    >
      <div contentEditable={false} className="flex-1">
        <Editable
          className={`overflow-hidden ${className}`}
          renderElement={renderElement}
          renderLeaf={EditorLeaf}
          decorate={decorate}
          readOnly
        />
      </div>
    </Slate>
  );
}

export default memo(ReadOnlyNoteEditor);
