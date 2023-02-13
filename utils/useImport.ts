import { useCallback } from 'react';
import { Descendant, Element, Node } from 'slate';
import { toast } from 'react-toastify';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import wikiLinkPlugin from 'remark-wiki-link';
import { v4 as uuidv4 } from 'uuid';
import { store, useStore } from 'lib/store';
import { NoteUpsert } from 'lib/api/upsertNote';
import supabase from 'lib/supabase';
import remarkSupersub from 'lib/remark-supersub';
import remarkToSlate from 'editor/serialization/remarkToSlate';
import { getDefaultEditorValue } from 'editor/constants';
import { caseInsensitiveStringEqual } from 'utils/string';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { encryptNote } from 'utils/encryption';
import { useAuth } from 'utils/useAuth';
import { ElementType, NoteLink } from 'types/slate';
import { Note } from 'types/supabase';
import { DecryptedNote } from 'types/decrypted';

export default function useImport() {
  const { id: deckId, key } = useCurrentDeck();
  const { user } = useAuth();
  const authorOnlyNotes = useStore(state => state.authorOnlyNotes);
  const upsertNote = useStore(state => state.upsertNote);

  const onImport = useCallback(() => {
    if (!deckId || !key || !user) {
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.text, .txt, .md, .mkdn, .mdwn, .mdown, .markdown';
    input.multiple = true;

    input.onchange = async e => {
      if (!e.target) {
        return;
      }

      const inputElement = e.target as HTMLInputElement;

      if (!inputElement.files) {
        return;
      }

      const importingToast = toast.info('Importing notes, please wait...', {
        autoClose: false,
        closeButton: false,
        draggable: false,
      });

      // Add a new note for each imported note
      const upsertData: any[] = [];
      const noteLinkUpsertData: any[] = [];
      const noteTitleToIdCache: Record<string, string | undefined> = {};
      for (const file of inputElement.files) {
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        if (!fileName) {
          continue;
        }
        const fileContent = await file.text();

        const { result } = unified()
          .use(remarkParse)
          .use(remarkSupersub)
          .use(remarkGfm)
          .use(wikiLinkPlugin, { aliasDivider: '|' })
          .use(remarkToSlate)
          .processSync(fileContent);

        const { content: slateContent, upsertData: newUpsertData } = fixNoteLinks(
          result as Descendant[],
          noteTitleToIdCache,
          deckId,
        );

        noteLinkUpsertData.push(...newUpsertData);
        upsertData.push({
          title: fileName,
          content: slateContent.length > 0 ? slateContent : getDefaultEditorValue(),
        });
      }

      const mergedUpsertData: DecryptedNote[] = upsertData.map((data: any) => {
        const matchingNoteLinkUpsertItem = noteLinkUpsertData.find(item => item.title === data.title);
        const mergedData = matchingNoteLinkUpsertItem ? { ...data, ...matchingNoteLinkUpsertItem } : data;
        const note = { id: uuidv4(), deck_id: deckId, user_id: user.id, author_only: authorOnlyNotes, ...mergedData };

        return note;
      });
      const encryptedUpsertData = mergedUpsertData.map(note => encryptNote(note, key));
      const { data: newNotes } = await supabase.from<Note>('notes').upsert(encryptedUpsertData);

      for (const note of mergedUpsertData) {
        if (newNotes?.find(dbNote => dbNote.id === note.id)) {
          upsertNote(note);
        }
      }

      // Show a toast with the number of successfully imported notes
      toast.dismiss(importingToast);
      const numOfSuccessfulImports = [...(newNotes ?? [])]?.filter(note => !!note).length ?? 0;
      if (numOfSuccessfulImports > 1) {
        toast.success(`${numOfSuccessfulImports} notes were successfully imported.`);
      } else if (numOfSuccessfulImports === 1) {
        toast.success(`${numOfSuccessfulImports} note was successfully imported.`);
      } else {
        toast.error('No notes were imported.');
      }
    };

    input.click();
  }, [deckId, key, authorOnlyNotes]);

  return onImport;
}

/**
 * Fixes note links by adding the proper note id to the link.
 * The note id comes from an existing note, or a new note is created.
 */
const fixNoteLinks = (
  content: Descendant[],
  noteTitleToIdCache: Record<string, string | undefined> = {},
  deckId: string,
): { content: Descendant[]; upsertData: NoteUpsert[] } => {
  const upsertData: NoteUpsert[] = [];

  // Update note link elements with noteId
  const notesArr = Object.values(store.getState().notes);
  const newContent = content.map(node => setNoteLinkIds(node, notesArr, noteTitleToIdCache, upsertData, deckId));

  return { content: newContent, upsertData };
};

const getNoteId = (
  node: NoteLink,
  notes: DecryptedNote[],
  noteTitleToIdCache: Record<string, string | undefined>,
  upsertData: any[],
  deckId: string,
): string => {
  const noteTitle = node.noteTitle;
  let noteId;

  const existingNoteId =
    noteTitleToIdCache[noteTitle.toLowerCase()] ??
    notes.find(note => caseInsensitiveStringEqual(note.title, noteTitle))?.id;

  if (existingNoteId) {
    noteId = existingNoteId;
  } else {
    noteId = uuidv4(); // Create new note id
    if (deckId) {
      upsertData.push({ id: noteId, deck_id: deckId, title: noteTitle });
    }
  }
  noteTitleToIdCache[noteTitle.toLowerCase()] = noteId; // Add to cache
  return noteId;
};

const setNoteLinkIds = (
  node: Descendant,
  notes: DecryptedNote[],
  noteTitleToIdCache: Record<string, string | undefined>,
  upsertData: any[],
  deckId: string,
): Node => {
  if (Element.isElement(node)) {
    return {
      ...node,
      ...(node.type === ElementType.NoteLink
        ? { noteId: getNoteId(node, notes, noteTitleToIdCache, upsertData, deckId) }
        : {}),
      children: node.children.map(child => setNoteLinkIds(child, notes, noteTitleToIdCache, upsertData, deckId)),
    };
  } else {
    return node;
  }
};
