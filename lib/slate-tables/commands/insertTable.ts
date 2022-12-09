import { type Location, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import { createTable } from '../nodes';
import type { TablesEditor } from '../TablesEditor';

export function insertTable(
  editor: TablesEditor,
  location: Location | undefined = editor.selection ?? undefined,
  props?: Parameters<typeof createTable>[1],
) {
  if (!location) {
    return false;
  }

  Transforms.insertNodes(editor, createTable(editor, props), {
    at: location,
  });

  ReactEditor.focus(editor);

  return true;
}
