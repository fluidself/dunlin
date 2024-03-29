import { createEditor, Editor, Element, Transforms } from 'slate';
import { encrypt } from 'utils/encryption';
import { ElementType } from 'types/slate';
import { Note } from 'types/supabase';
import supabase from 'lib/supabase';
import { store } from 'lib/store';
import { computeLinkedBacklinks } from './useBacklinks';

/**
 * Deletes the backlinks on each backlinked note and replaces them with the link text.
 */
const deleteBacklinks = async (noteId: string) => {
  const notes = store.getState().notes;
  const key = store.getState().deckKey;
  const backlinks = computeLinkedBacklinks(notes, noteId);
  const updateData: any[] = [];

  for (const backlink of backlinks) {
    const note = notes[backlink.id];

    if (!note) {
      continue;
    }

    const editor = createEditor();
    editor.children = note.content;

    Transforms.unwrapNodes(editor, {
      at: [],
      match: n =>
        !Editor.isEditor(n) && Element.isElement(n) && n['type'] === ElementType.NoteLink && n['noteId'] === noteId,
    });

    updateData.push({
      id: backlink.id,
      content: editor.children,
      encryptedContent: encrypt(editor.children, key),
    });
  }

  // Make sure backlinks are updated locally
  for (const newNote of updateData) {
    store.getState().updateNote({ id: newNote.id, content: newNote.content });
  }

  // It would be better if we could consolidate the update requests into one request
  // See https://github.com/supabase/supabase-js/issues/156
  const promises = [];
  for (const data of updateData) {
    promises.push(
      supabase
        .from<Note>('notes')
        .update({ content: data.encryptedContent, updated_at: new Date().toISOString() })
        .eq('id', data.id),
    );
  }
  await Promise.all(promises);
};

export default deleteBacklinks;
