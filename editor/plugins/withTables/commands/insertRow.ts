import { type Location, Path, Transforms, Node } from 'slate';
import { ReactEditor } from 'slate-react';
import { Traverse } from '../core';
import { getCellRowspan, createTableRow } from '../nodes';
import type { TablesEditor } from '../TablesEditor';
import type { VerticalSides } from '../utils/types';

export function insertRow(
  editor: TablesEditor,
  location: Location | undefined = editor.selection ?? undefined,
  side: VerticalSides,
) {
  if (!location) {
    return false;
  }

  const traverse = Traverse.create(editor, location);

  if (!traverse) {
    return false;
  }

  const { activeRow } = traverse;

  const cellsToAdd = activeRow.cells.reduce((acc, c) => {
    if (c.isVirtual && getCellRowspan(c.node) > 1) {
      return acc;
    } else {
      return acc + 1;
    }
  }, 0);

  const newRow = createTableRow(editor, { children: cellsToAdd });
  const at = side === 'below' ? Path.next(activeRow.path) : activeRow.path;

  console.log({ activeRow, at });

  Transforms.insertNodes(editor, newRow, { at });

  ReactEditor.focus(editor);

  const [, firstCellInNewRowPath] = Node.first(editor, at);
  Transforms.select(editor, firstCellInNewRowPath);

  return true;
}
