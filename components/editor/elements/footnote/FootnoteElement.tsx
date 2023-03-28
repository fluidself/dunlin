import { useCallback, useEffect, useMemo, useState, useRef, Fragment, ReactNode } from 'react';
import { ReactEditor, RenderElementProps, useFocused, useReadOnly, useSelected, useSlateStatic } from 'slate-react';
import { Descendant, Editor, Element, Range, Transforms, createEditor } from 'slate';
import { useRouter } from 'next/router';
import { Popover } from '@headlessui/react';
import { usePopper } from 'react-popper';
import { toast } from 'react-toastify';
import classNames from 'classnames';
import { useCurrentNote } from 'utils/useCurrentNote';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { encrypt } from 'utils/encryption';
import { getDefaultEditorValue } from 'editor/constants';
import { store, useStore } from 'lib/store';
import updateDbNote from 'lib/api/updateNote';
import { ElementType, Footnote } from 'types/slate';
import Portal from 'components/Portal';
import FootnoteDefinition from './FootnoteDefinition';

const SYNC_DEBOUNCE_MS = 1000;

type Props = {
  element: Footnote;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function FootnoteElement(props: Props) {
  const { className, element, children, attributes } = props;
  const router = useRouter();
  const editor = useSlateStatic();
  const selected = useSelected();
  const focused = useFocused();
  const readOnly = useReadOnly();
  const { id: noteId } = useCurrentNote();
  const { key } = useCurrentDeck();
  const path = useMemo(() => ReactEditor.findPath(editor, element), [editor, element]);
  const noteContent = useStore(state => state.notes[noteId]?.content ?? getDefaultEditorValue());
  const footnoteMarker = useMemo(() => computeFootnoteMarker(noteContent, element.id), [noteContent, element.id]);
  const [definition, setDefinition] = useState(element.definition ?? getDefaultEditorValue());
  const [isVisible, setIsVisible] = useState(false);
  const [isSynced, setIsSynced] = useState(true);
  const referenceElementRef = useRef<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const {
    styles,
    attributes: popperAttributes,
    state,
  } = usePopper(referenceElementRef.current, popperElement, {
    placement: 'bottom',
    modifiers: [{ name: 'offset', options: { offset: [100, 6] } }],
  });
  const isMovedOnto = useMemo(
    () => selected && editor.selection && Range.isCollapsed(editor.selection),
    [selected, editor.selection],
  );

  useEffect(() => {
    if (isMovedOnto) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isMovedOnto]);

  const onDefinitionChange = useCallback((definition: Descendant[]) => {
    setDefinition(definition);
    setIsSynced(false);
  }, []);

  const handleNoteUpdate = useCallback(
    async (newProperties: Partial<Footnote>) => {
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
        console.error(`There was an error updating the footnote: ${message}`);
        toast.error('Something went wrong saving your note. Please try again later.');
      }
    },
    [editor, path, noteId, key],
  );

  useEffect(() => {
    if (readOnly || isSynced) return;

    const newProperties: Partial<Footnote> = {
      definition: definition,
    };

    const handler = setTimeout(() => handleNoteUpdate(newProperties), SYNC_DEBOUNCE_MS);
    return () => clearTimeout(handler);
  }, [readOnly, isSynced, definition, handleNoteUpdate]);

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

  const hidePopover = useCallback(() => {
    setIsVisible(false);
    Transforms.select(editor, path);
    Transforms.move(editor, { unit: 'character' });
    ReactEditor.focus(editor);
  }, [editor, path]);

  const foootnoteMarkerClassName = classNames(
    'flex-inline items-center justify-center p-0.25 text-sm rounded text-primary-600 dark:text-primary-400 hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700 focus:outline-none',
    { 'bg-primary-100 dark:bg-primary-900': selected && focused },
    className,
  );

  return (
    <Popover as={Fragment} {...attributes}>
      <>
        <Popover.Button
          ref={referenceElementRef}
          role="button"
          as="sup"
          className={foootnoteMarkerClassName}
          contentEditable={false}
          onClick={() => setIsVisible(!isVisible)}
        >
          [{footnoteMarker}]{children}
        </Popover.Button>
        {isVisible && (
          <Portal>
            <Popover.Panel
              className={`z-10 px-2 overflow-y-auto rounded shadow-popover w-96 max-h-128 bg-white dark:bg-gray-800 dark:text-gray-100 border dark:border-gray-600 ${
                state?.modifiersData.hide?.isReferenceHidden ? 'invisible pointer-events-none' : ''
              }`}
              contentEditable={false}
              static
              ref={setPopperElement}
              style={styles.popper}
              {...popperAttributes.popper}
            >
              <FootnoteDefinition value={definition} onChange={onDefinitionChange} onClose={hidePopover} />
            </Popover.Panel>
          </Portal>
        )}
      </>
    </Popover>
  );
}

const computeFootnoteMarker = (content: Descendant[], elementId: string) => {
  const editor = createEditor();
  editor.children = content;
  const footnotes = Array.from(
    Editor.nodes<Footnote>(editor, {
      at: [],
      match: n => Element.isElement(n) && n.type === ElementType.Footnote,
    }),
  ).map(element => element[0]);

  return footnotes.findIndex(fn => fn.id === elementId) + 1;
};
