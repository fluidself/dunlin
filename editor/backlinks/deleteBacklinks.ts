import { createEditor, Editor, Element, Transforms } from 'slate';
import { encrypt } from 'utils/encryption';
import { ElementType } from 'types/slate';
import { store } from 'lib/store';
import updateNote from 'lib/api/updateNote';
import { computeLinkedBacklinks } from './useBacklinks';

/**
 * Deletes the backlinks on each backlinked note and replaces them with the link text.
 */
const deleteBacklinks = async (noteId: string, key: string) => {
  const notes = store.getState().notes;
  const backlinks = computeLinkedBacklinks(notes, noteId);
  // const updateData: Pick<Note, 'id' | 'content'>[] = [];
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
      match: n => !Editor.isEditor(n) && Element.isElement(n) && n['type'] === ElementType.NoteLink && n['noteId'] === noteId,
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
    promises.push(updateNote({ id: data.id, content: data.encryptedContent }));
  }
  await Promise.all(promises);
};

export default deleteBacklinks;
