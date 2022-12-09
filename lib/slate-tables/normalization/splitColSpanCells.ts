import _times from 'lodash/times';
import { Editor, Path, Node, Transforms } from 'slate';
import { TableCell } from 'types/slate';

import type { TableCellNode } from '../nodes';
import { TablesEditor, createTableCell } from '../TablesEditor';

export function splitColSpanCells(editor: TablesEditor, path: Path) {
  const node = Node.get(editor, path);

  if (!editor.isTableRowNode(node)) {
    return false;
  }

  for (const [child, childPath] of Node.children(editor, path)) {
    if (!editor.isTableCellNode(child)) continue;

    const cell = child as TableCell;
    if (cell.colspan && cell.colspan > 1) {
      const padCells = _times(cell.colspan - 1, () => createTableCell(editor));

      Editor.withoutNormalizing(editor, () => {
        Transforms.unsetNodes<TableCellNode>(editor, 'colspan', { at: childPath });
        Transforms.insertNodes(editor, padCells, { at: Path.next(childPath) });
      });

      return true;
    }
  }

  return false;
}
