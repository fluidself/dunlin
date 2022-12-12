import { type Location, Transforms, Editor } from 'slate';
import { ReactEditor } from 'slate-react';
import { ElementType } from 'types/slate';
import type { TablesEditor } from '../TablesEditor';
import { createTable } from '../nodes';
import { isInTable } from '../queries';

export function insertTable(
  editor: TablesEditor,
  location: Location | undefined = editor.selection ?? undefined,
  props?: Parameters<typeof createTable>[1],
) {
  if (!location || isInTable(editor)) {
    return false;
  }

  Transforms.insertNodes(editor, createTable(editor, props), {
    at: location,
  });

  const createdTable = Editor.next(editor, {
    match: n => n.type === ElementType.Table,
  });

  if (createdTable) {
    Transforms.setSelection(editor, {
      anchor: { path: [...createdTable[1], 0, 0, 0], offset: 0 },
      focus: { path: [...createdTable[1], 0, 0, 0], offset: 0 },
    });
  }

  ReactEditor.focus(editor);

  return true;
}
