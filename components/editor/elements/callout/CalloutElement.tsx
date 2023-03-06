import { ChangeEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { ReactEditor, RenderElementProps, useSlateStatic, useReadOnly } from 'slate-react';
import { Descendant, Transforms, createEditor } from 'slate';
import { useRouter } from 'next/router';
import { IconCode } from '@tabler/icons';
import { toast } from 'react-toastify';
import { Callout } from 'types/slate';
import { getDefaultEditorValue } from 'editor/constants';
import { store } from 'lib/store';
import updateDbNote from 'lib/api/updateNote';
import { useCurrentNote } from 'utils/useCurrentNote';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { encrypt } from 'utils/encryption';
import Tooltip from 'components/Tooltip';
import { calloutConfig, CalloutType } from './config';
import CalloutContent from './CalloutContent';
import CalloutMenu from './CalloutMenu';

const SYNC_DEBOUNCE_MS = 1000;

type CalloutElementProps = {
  children: ReactNode;
  element: Callout;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function CalloutElement(props: CalloutElementProps) {
  const { attributes, children, element, className } = props;
  const router = useRouter();
  const editor = useSlateStatic();
  const readOnly = useReadOnly();
  const { id: noteId } = useCurrentNote();
  const { key } = useCurrentDeck();
  const path = useMemo(() => ReactEditor.findPath(editor, element), [editor, element]);
  const calloutDetails = useMemo(() => calloutConfig[element.calloutType], [element.calloutType]);
  const [title, setTitle] = useState(element.title ?? '');
  const [content, setContent] = useState(element.content ?? getDefaultEditorValue());
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isSynced, setIsSynced] = useState(true);

  const onTypeChange = useCallback(
    (type: CalloutType) => {
      Transforms.setNodes(editor, { calloutType: type }, { at: path });
      setIsSynced(false);
    },
    [editor, path],
  );

  const onTitleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
    setIsSynced(false);
  }, []);

  const onContentChange = useCallback((content: Descendant[]) => {
    setContent(content);
    setIsSynced(false);
  }, []);

  const handleNoteUpdate = useCallback(
    async (newProperties: Partial<Callout>) => {
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
        console.error(`There was an error updating the callout: ${message}`);
        toast.error('Something went wrong saving your note. Please try again later.');
      }
    },
    [editor, path, noteId, key],
  );

  useEffect(() => {
    if (readOnly || isSynced) return;

    const newProperties: Partial<Callout> = {
      calloutType: element.calloutType,
      title: title,
      content: content,
    };

    const handler = setTimeout(() => handleNoteUpdate(newProperties), SYNC_DEBOUNCE_MS);
    return () => clearTimeout(handler);
  }, [readOnly, isSynced, element.calloutType, content, title, handleNoteUpdate]);

  const Icon = calloutDetails.svg;

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
    <div className={className} {...attributes} contentEditable={false}>
      <div className={`rounded group relative py-2 pr-2 pl-4 ${calloutDetails.colors.background}`}>
        <div className="flex items-center">
          <Icon className={`${calloutDetails.colors.svg} mr-1`} />
          <input
            value={title}
            disabled={readOnly}
            className={`bg-transparent outline-none block w-full font-bold ${calloutDetails.colors.text}`}
            placeholder={calloutDetails.defaultTitle}
            onChange={onTitleChange}
          />
        </div>
        {!readOnly ? (
          <Tooltip content="Callout settings" placement="bottom">
            <button
              className="opacity-0.1 group-hover:opacity-100 flex items-center p-1 absolute top-0.5 right-0.5 rounded text-gray-300 hover:text-gray-100 hover:bg-gray-700"
              onClick={() => setMenuOpen(!isMenuOpen)}
            >
              <IconCode size={18} />
            </button>
          </Tooltip>
        ) : null}
        <CalloutContent elementId={element.id} value={content} onChange={onContentChange} />
        {isMenuOpen ? (
          <CalloutMenu selectedType={element.calloutType} onClose={() => setMenuOpen(false)} onUpdate={onTypeChange} />
        ) : null}
      </div>
      {children}
    </div>
  );
}
