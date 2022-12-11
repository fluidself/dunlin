import _times from 'lodash/times';
import { Node, Transforms, Path } from 'slate';
import type { Table, TableRow } from 'types/slate';
import { TablesEditor, createTableCell } from '../TablesEditor';

export function insertMissingCells(editor: TablesEditor, path: Path) {
  const table: Table = Node.get(editor, path);

  if (!editor.isTableNode(table)) {
    return false;
  }

  const maxWidth = Math.max(...table.children.map(node => (editor.isTableRowNode(node) ? calculateRowWidth(node) : 0)));

  for (const [child, childPath] of Node.children(editor, path)) {
    if (!editor.isTableRowNode(child)) continue;

    const row = child as TableRow;
    const rowSize = calculateRowWidth(row);
    const absentCellsQuantity = maxWidth - rowSize;

    if (absentCellsQuantity > 0) {
      const newCells = _times(absentCellsQuantity, () => createTableCell(editor));

      const lastNodeInRowEntry = Array.from(Node.children(editor, childPath)).at(-1);

      if (lastNodeInRowEntry) {
        const [lastNode, lastNodePath] = lastNodeInRowEntry;

        if (editor.isTableCellNode(lastNode)) {
          Transforms.insertNodes(editor, newCells, {
            at: Path.next(lastNodePath),
          });
          return true;
        }
      }
    }
  }

  return false;
}

function calculateRowWidth(row: TableRow) {
  return row.children.reduce((size, cell) => size + (cell.colspan ?? 1), 0);
}
