import { type Location, Transforms, Editor } from 'slate';
import { ReactEditor } from 'slate-react';
import type { Table } from 'types/slate';
import type { TablesEditor } from '../TablesEditor';
import { createTable } from '../nodes';
import { isInTable } from '../queries';

export function insertTable(
  editor: TablesEditor,
  location: Location | undefined = editor.selection ?? undefined,
  props?: Parameters<typeof createTable>[1],
) {
  if (!location || isInTable(editor)) return false;

  const table = createTable(editor, props);
  Transforms.insertNodes(editor, table, { at: location });

  const [tablePath] = Array.from(
    Editor.nodes<Table>(editor, {
      at: [],
      match: n => editor.isTableNode(n) && n.id === table.id,
    }),
  ).map(entry => entry[1]);

  if (tablePath) {
    Transforms.setSelection(editor, {
      anchor: { path: [...tablePath, 0, 0, 0], offset: 0 },
      focus: { path: [...tablePath, 0, 0, 0], offset: 0 },
    });
  }

  ReactEditor.focus(editor);

  return true;
}
