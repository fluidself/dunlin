import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
const Excalidraw = dynamic(async () => (await import('@excalidraw/excalidraw')).Excalidraw, {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px]">
      <Spinner />
    </div>
  ),
});
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { ReactEditor, RenderElementProps, useSlateStatic, useReadOnly, useFocused, useSelected } from 'slate-react';
import { Transforms, createEditor } from 'slate';
import { toast } from 'react-toastify';
import { Whiteboard } from 'types/slate';
import { store, useStore } from 'lib/store';
import updateDbNote from 'lib/api/updateNote';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { useCurrentNote } from 'utils/useCurrentNote';
import { encrypt } from 'utils/encryption';
import Spinner from 'components/Spinner';

const SYNC_DEBOUNCE_MS = 3000;

type Props = {
  element: Whiteboard;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function WhiteboardElement(props: Props) {
  const { attributes, children, element, className } = props;
  const { id: noteId } = useCurrentNote();
  const { key } = useCurrentDeck();
  const router = useRouter();
  const editor = useSlateStatic();
  const readOnly = useReadOnly();
  const selected = useSelected();
  const focused = useFocused();
  const darkMode = useStore(state => state.darkMode);
  const path = useMemo(() => ReactEditor.findPath(editor, element), [editor, element]);
  const previousStateRef = useRef(JSON.stringify({ data: element.data }));
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isSynced, setIsSynced] = useState(true);

  const handleNoteUpdate = useCallback(
    async (newProperties: Partial<Whiteboard>) => {
      if (!key) return;

      try {
        Transforms.setNodes(editor, newProperties, { at: path });
        const noteEditor = createEditor();
        noteEditor.children = store.getState().notes[noteId].content;
        Transforms.setNodes(noteEditor, newProperties, { at: path });
        store.getState().updateNote({ id: noteId, content: noteEditor.children });
        const encryptedContent = encrypt(noteEditor.children, key);
        const { error } = await updateDbNote({ id: noteId, content: encryptedContent });
        if (error) throw error;
        setIsSynced(true);
      } catch (e) {
        const message = e instanceof Error ? e.message : e;
        console.error(`There was an error updating the whiteboard: ${message}`);
        toast.error('Something went wrong saving your note. Please try again later.');
      }
    },
    [editor, path, noteId, key],
  );

  useEffect(() => {
    if (readOnly || isSynced || !excalidrawAPI) return;

    const handler = setTimeout(() => {
      const appState = excalidrawAPI.getAppState();
      const newProperties: Partial<Whiteboard> = {
        data: {
          elements: JSON.parse(JSON.stringify(excalidrawAPI.getSceneElements())),
          state: {
            gridSize: appState.gridSize,
            viewBackgroundColor: appState.viewBackgroundColor,
          },
        },
      };
      const currentState = JSON.stringify(newProperties);
      setIsSynced(currentState === previousStateRef.current);

      if (currentState !== previousStateRef.current) {
        previousStateRef.current = currentState;
        handleNoteUpdate(JSON.parse(JSON.stringify(newProperties)));
      }
    }, SYNC_DEBOUNCE_MS);

    return () => clearTimeout(handler);
  }, [readOnly, isSynced, excalidrawAPI, handleNoteUpdate]);

  useEffect(() => {
    if (readOnly) return;
    const warningText = 'You have unsaved changes — are you sure you wish to leave this page?';

    const handleWindowClose = (e: BeforeUnloadEvent) => {
      if (isSynced) return;
      e.preventDefault();
      return (e.returnValue = warningText);
    };
    const handleBrowseAway = () => {
      if (isSynced) return;
      if (window.confirm(warningText)) return;
      router.events.emit('routeChangeError');
      throw 'routeChange aborted';
    };

    window.addEventListener('beforeunload', handleWindowClose);
    router.events.on('routeChangeStart', handleBrowseAway);

    return () => {
      window.removeEventListener('beforeunload', handleWindowClose);
      router.events.off('routeChangeStart', handleBrowseAway);
    };
  }, [router, readOnly, isSynced]);

  return (
    <div className={className} {...attributes}>
      <div
        className={`border border-transparent rounded relative group ${
          selected && focused
            ? 'ring ring-primary-100 dark:ring-primary-900'
            : 'hover:border-gray-300 dark:hover:border-gray-700'
        }`}
      >
        <div contentEditable={false}>
          <div className="h-[600px]">
            <Excalidraw
              theme={darkMode ? 'dark' : 'light'}
              excalidrawAPI={api => setExcalidrawAPI(api)}
              onPointerDown={() => setIsSynced(false)}
              UIOptions={{ canvasActions: { changeViewBackgroundColor: false } }}
              initialData={{
                elements: element.data?.elements ?? [],
                appState: element.data?.state ?? {},
                scrollToContent: true,
              }}
            />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
