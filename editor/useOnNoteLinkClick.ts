import { MouseEvent, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Path } from 'slate';
import { getDefaultEditorValue } from 'editor/constants';
import { encryptNote } from 'utils/encryption';
import upsertNote from 'lib/api/upsertNote';
import { useStore } from 'lib/store';
import { queryParamToArray } from 'utils/url';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { useAuth } from 'utils/useAuth';

export default function useOnNoteLinkClick(currentNoteId: string, linkText?: string) {
  const router = useRouter();
  const {
    query: { deckId, stack: stackQuery },
  } = router;
  const { key } = useCurrentDeck();
  const { user } = useAuth();
  const notes = useStore(state => state.notes);
  const openNoteIds = useStore(state => state.openNoteIds);
  const isPageStackingOn = useStore(state => state.isPageStackingOn);

  const onClick = useCallback(
    async (noteId: string, stackNote: boolean, highlightedPath?: Path) => {
      if (!notes[noteId] && linkText && user) {
        const note = {
          id: noteId,
          deck_id: deckId,
          user_id: user.id,
          title: linkText,
          content: getDefaultEditorValue(),
          // TODO: DECK-wide setting to default this to false?
          view_only: true,
        };
        const encryptedNote = encryptNote(note, key);
        await upsertNote(encryptedNote, key);
      }

      // If stackNote is false, open the note in its own page
      if (!stackNote) {
        const hash = highlightedPath ? `0-${highlightedPath}` : undefined;
        router.push({
          pathname: `/app/[deckId]/note/[id]`,
          query: { deckId, id: noteId },
          hash,
        });
        return;
      }

      // If the note is already open, scroll it into view
      const index = openNoteIds.findIndex(openNoteId => openNoteId === noteId);
      if (index > -1) {
        const noteElement = document.getElementById(openNoteIds[index]);
        if (noteElement) {
          const notesContainer = noteElement.parentElement;
          const noteWidth = noteElement.offsetWidth;
          notesContainer?.scrollTo({
            left: noteWidth * index, // We assume all the notes are the same width
            behavior: 'smooth',
          });
        }

        if (highlightedPath) {
          // Update highlighted path; scrolling is handled in editor
          router.push({ hash: `${index}-${highlightedPath}` }, undefined, {
            shallow: true,
          });
        }

        return;
      }

      // If the note is not open, add it to the open notes after currentNoteId
      const currentNoteIndex = openNoteIds.findIndex(openNoteId => openNoteId === currentNoteId);
      if (currentNoteIndex < 0) {
        console.error(`Error: current note ${currentNoteId} is not in open notes`);
        return;
      }

      const newNoteIndex = currentNoteIndex + 1;

      // Replace the notes after the current note with the new note
      const stackedNoteIds = queryParamToArray(stackQuery);
      stackedNoteIds.splice(
        newNoteIndex - 1, // Stacked notes don't include the main note
        stackedNoteIds.length - (newNoteIndex - 1),
        noteId,
      );

      // Open the note as a stacked note
      const hash = highlightedPath ? `${newNoteIndex}-${highlightedPath}` : undefined;
      router.push(
        {
          pathname: `/app/[deckId]/note/[id]`,
          query: { ...router.query, stack: stackedNoteIds },
          hash,
        },
        undefined,
        { shallow: true },
      );
    },
    [router, openNoteIds, currentNoteId, stackQuery],
  );

  const defaultStackingBehavior = useCallback(
    (e: MouseEvent) => (isPageStackingOn && !e.shiftKey) || (!isPageStackingOn && e.shiftKey),
    [isPageStackingOn],
  );

  return { onClick, defaultStackingBehavior };
}
