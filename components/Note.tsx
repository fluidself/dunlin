import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { Path } from 'slate';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import Editor from 'components/editor/Editor';
import Title from 'components/editor/Title';
import { store, useStore } from 'lib/store';
import { Note } from 'types/supabase';
import updateDbNote, { NoteUpdate } from 'lib/api/updateNote';
import { ProvideCurrentNote } from 'utils/useCurrentNote';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { useAuth } from 'utils/useAuth';
import { caseInsensitiveStringEqual } from 'utils/string';
import { encryptNote } from 'utils/encryption';
import updateBacklinks from 'editor/backlinks/updateBacklinks';
import Backlinks from './editor/backlinks/Backlinks';
import NoteHeader from './editor/NoteHeader';
import ErrorBoundary from './ErrorBoundary';
import ReadOnlyNoteEditor from './editor/ReadOnlyNoteEditor';
import ReadOnlyTitle from './editor/ReadOnlyTitle';

const SYNC_DEBOUNCE_MS = 1000;

type Props = {
  noteId: string;
  highlightedPath?: Path;
  className?: string;
};

function Note(props: Props) {
  const { noteId, highlightedPath, className } = props;
  const router = useRouter();
  const { key, user_id: deckOwner } = useCurrentDeck();
  const { user } = useAuth();

  const note = store.getState().notes[noteId];
  const noteIsViewOnlyForUser = useMemo(
    () => user && note && note.author_only && note.user_id !== user.id, // && user.id !== deckOwner
    [note, user],
  );
  const updateNote = useStore(state => state.updateNote);

  const [syncState, setSyncState] = useState({
    isTitleSynced: true,
    isContentSynced: true,
  });
  const isSynced = useMemo(() => syncState.isTitleSynced && syncState.isContentSynced, [syncState]);

  const onTitleChange = useCallback(
    (title: string) => {
      // Only update note title in storage if there isn't already a note with that title
      const newTitle = title || getUntitledTitle(noteId);
      const notesArr = Object.values(store.getState().notes);
      const isTitleUnique = notesArr.findIndex(n => n.id !== noteId && caseInsensitiveStringEqual(n.title, newTitle)) === -1;
      if (isTitleUnique) {
        updateNote({ id: noteId, title: newTitle });
        setSyncState(syncState => ({ ...syncState, isTitleSynced: false }));
      } else {
        toast.error(`There's already a note called ${newTitle}. Please use a different title.`);
      }
    },
    [noteId, updateNote],
  );

  const onEditorValueChange = useCallback(() => {
    setSyncState(syncState => ({ ...syncState, isContentSynced: false }));
  }, []);

  const handleNoteUpdate = useCallback(
    async (note: any) => {
      if (!key) return;
      const encryptedNote: NoteUpdate = encryptNote(note, key);

      const { error } = await updateDbNote(encryptedNote);

      if (error) {
        toast.error('Something went wrong saving your note. Please try again later.');
        return;
      }
      if (note.title) {
        await updateBacklinks(note.title, note.id, key);
      }
      setSyncState({ isTitleSynced: true, isContentSynced: true });
    },
    [key],
  );

  // Save the note in the database if it changes and it hasn't been saved yet
  useEffect(() => {
    // if (!note || noteIsViewOnlyForUser) return;
    if (!note) return;

    const noteUpdate: any = { id: noteId };
    if (!syncState.isContentSynced) {
      noteUpdate.content = note.content;
    }
    if (!syncState.isTitleSynced) {
      noteUpdate.title = note.title;
    }

    if (noteUpdate.title || noteUpdate.content) {
      const handler = setTimeout(() => handleNoteUpdate(noteUpdate), SYNC_DEBOUNCE_MS);
      return () => clearTimeout(handler);
    }
  }, [note, noteId, noteIsViewOnlyForUser, syncState, handleNoteUpdate]);

  // Prompt the user with a dialog box about unsaved changes if they navigate away
  useEffect(() => {
    // if (noteIsViewOnlyForUser) return;
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
  }, [router, isSynced, noteIsViewOnlyForUser]);

  const noteContainerClassName = 'flex flex-col flex-shrink-0 md:flex-shrink w-full bg-white dark:bg-gray-900 dark:text-gray-100';
  const errorContainerClassName = `${noteContainerClassName} items-center justify-center h-full p-4`;
  const editorClassName = 'flex-1 px-8 pt-2 pb-8 md:pb-12 md:px-12';
  const titleClassName = 'px-8 pt-8 pb-1 md:pt-12 md:px-12';

  const currentNoteValue = useMemo(() => ({ id: noteId }), [noteId]);

  const noteExists = useMemo(() => !!store.getState().notes[noteId], [noteId]);
  if (!noteExists) {
    return (
      <div className={errorContainerClassName}>
        <p>Whoops&mdash;it doesn&apos;t look like this note exists!</p>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className={errorContainerClassName}>
          <p>An unexpected error occurred when rendering this note.</p>
        </div>
      }
    >
      <ProvideCurrentNote value={currentNoteValue}>
        <div id={noteId} className={`${noteContainerClassName} ${className}`}>
          <NoteHeader />
          <div className="flex flex-col flex-1 overflow-x-hidden overflow-y-auto">
            <div className="flex flex-col flex-1 w-full mx-auto md:w-128 lg:w-160 xl:w-192">
              {noteIsViewOnlyForUser ? (
                <>
                  <ReadOnlyTitle className={titleClassName} noteId={noteId} />
                  <ReadOnlyNoteEditor className={editorClassName} noteId={noteId} />
                </>
              ) : (
                <>
                  <Title className={titleClassName} noteId={noteId} onChange={onTitleChange} />
                  <Editor
                    className={editorClassName}
                    noteId={noteId}
                    onChange={onEditorValueChange}
                    highlightedPath={highlightedPath}
                  />
                </>
              )}
              <Backlinks className="mx-4 mb-8 md:mx-8 md:mb-12" />
            </div>
          </div>
        </div>
      </ProvideCurrentNote>
    </ErrorBoundary>
  );
}

export default memo(Note);

// Get a unique "Untitled" title, ignoring the specified noteId.
const getUntitledTitle = (noteId: string) => {
  const title = 'Untitled';

  const getResult = () => (suffix > 0 ? `${title} ${suffix}` : title);

  let suffix = 0;
  const notesArr = Object.values(store.getState().notes);
  while (notesArr.findIndex(note => note.id !== noteId && caseInsensitiveStringEqual(note.title, getResult())) > -1) {
    suffix += 1;
  }

  return getResult();
};
