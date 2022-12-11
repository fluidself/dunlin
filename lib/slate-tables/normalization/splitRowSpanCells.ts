import _times from 'lodash/times';
import { Editor, Path, Node, Transforms } from 'slate';
import type { TableCell } from 'types/slate';
import { TablesEditor, createTableCell } from '../TablesEditor';

export function splitRowSpanCells(editor: TablesEditor, path: Path) {
  const node = Node.get(editor, path);

  if (!editor.isTableNode(node)) {
    return false;
  }

  for (const [row, rowPath] of Node.children(editor, path)) {
    if (!editor.isTableRowNode(row)) {
      continue;
    }

    for (const [child, childPath] of Node.children(editor, rowPath)) {
      if (!editor.isTableCellNode(child)) continue;

      const cell = child as TableCell;
      if (cell.colspan && cell.colspan > 1) {
        const cell = child as TableCell;
        const currentCellRelativePath = Path.relative(childPath, rowPath);
        const padCells = _times(cell.rowspan ?? 1 - 1, () => createTableCell(editor));

        Editor.withoutNormalizing(editor, () => {
          Transforms.unsetNodes<TableCell>(editor, 'rowspan', { at: childPath });
          let nextRow = Path.next(rowPath);

          for (const padCell of padCells) {
            const at = [...nextRow, ...currentCellRelativePath];

            if (Editor.hasPath(editor, at)) {
              Transforms.insertNodes(editor, padCell, { at });
            } else {
              console.error(`Can't find path to insert pad cell when split row spans at:`, at);
            }

            nextRow = Path.next(nextRow);
          }
        });

        return true;
      }
    }
  }

  return false;
}
