import { createEditor, Transforms } from 'slate';
import { encrypt } from 'utils/encryption';
import { Note } from 'types/supabase';
import supabase from 'lib/supabase';
import { store } from 'lib/store';
import { Backlink } from './useBacklinks';

/**
 * Updates the block text for each block reference. This is necessary for
 * full-text search.
 */
const updateBlockBacklinks = async (blockBacklinks: Backlink[], newText: string, key: string) => {
  const notes = store.getState().notes;
  const updateData: any[] = [];

  for (const backlink of blockBacklinks) {
    const note = notes[backlink.id];

    if (!note) {
      continue;
    }

    const editor = createEditor();
    editor.children = note.content;

    // Update the text of each block reference
    for (const match of backlink.matches) {
      Transforms.insertText(editor, newText, {
        at: match.path,
        voids: true,
      });
    }

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

export default updateBlockBacklinks;
