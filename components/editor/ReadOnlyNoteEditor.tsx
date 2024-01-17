import { memo, useMemo, useEffect } from 'react';
import { createEditor } from 'slate';
import { Editable, Slate, withReact } from 'slate-react';
import { SyncElement, toSharedType, withYjs, withCursor, useCursors } from 'slate-yjs';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import randomColor from 'randomcolor';
import { toast } from 'react-toastify';
import decorateCodeBlocks from 'editor/decorateCodeBlocks';
import withVoidElements from 'editor/plugins/withVoidElements';
import withLinks from 'editor/plugins/withLinks';
import withAnnotations from 'editor/plugins/withAnnotations';
import withNormalization from 'editor/plugins/withNormalization';
import withCodeBlocks from 'editor/plugins/withCodeBlocks';
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

function ReadOnlyNoteEditor(props: Props) {
  const { noteId, className } = props;
  const { user } = useAuth();

  const note = useStore(state => state.notes[noteId]);
  const initialValue = note?.content ?? getDefaultEditorValue();

  useEffect(() => {
    if (!note) {
      toast.warn('Someone deleted this note.', {
        toastId: noteId,
      });
    }
  });

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
    const provider = new WebsocketProvider(process.env.WEBSOCKET_ENDPOINT as string, noteId, doc, {
      connect: false,
    });

    return [sharedType, provider];
  }, [noteId]);

  const editor = useMemo(() => {
    const editor = withCursor(
      withYjs(
        withNormalization(
          withCodeBlocks(withVoidElements(withAnnotations(withLinks(withReact(createEditor() as DeckEditor))))),
        ),
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
        toSharedType(sharedType, initialValue);
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
      initialValue={initialValue}
      onChange={() => {
        /* Do nothing, this is a read only editor */
      }}
    >
      <div contentEditable={false} className="flex-1">
        <Editable
          className={`overflow-hidden focus-visible:outline-none ${className}`}
          renderElement={renderElement}
          renderLeaf={EditorLeaf}
          decorate={entry => {
            const codeSyntaxRanges = decorateCodeBlocks(editor, entry);
            const cursorRanges = decorate(entry);
            return [...codeSyntaxRanges, ...cursorRanges];
          }}
          readOnly
        />
      </div>
    </Slate>
  );
}

export default memo(ReadOnlyNoteEditor);
