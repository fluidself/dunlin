import { Editor, Transforms, Path, NodeEntry } from 'slate';
import { ElementType, TableCell } from 'types/slate';
import { splitTable, Col } from '../selection';
import { createCell } from '../creator';

export function insertRight(table: NodeEntry, editor: Editor) {
  const { selection } = editor;
  if (!selection || !table) return;

  const xIndex = table[1].length + 1;

  const { gridTable, getCol } = splitTable(editor, table);

  const [startCell] = Editor.nodes<TableCell>(editor, {
    match: n => n.type === ElementType.TableCell,
  });

  const [insertPositionCol] = getCol((c: Col) => c.cell.id === startCell[0].id && c.isReal);

  const x = insertPositionCol.path[xIndex] + 1 - 1;

  const insertCols = new Map<string, Col>();
  let checkInsertable = true;

  gridTable.forEach((row: Col[]) => {
    const col = row[x];

    const [originCol] = getCol((n: Col) => n.cell.id === col.cell.id && n.isReal);

    const { cell, path } = originCol;

    if (!row[x + 1] || col.isReal) {
      insertCols.set(cell.id, originCol);
    } else {
      if (path[xIndex] + 1 - 1 === x) {
        insertCols.set(cell.id, originCol);
      } else {
        checkInsertable = false;
        return;
      }
    }
  });

  if (!checkInsertable) {
    return;
  }

  insertCols.forEach((col: Col) => {
    const newCell = createCell();

    Transforms.insertNodes(editor, newCell, {
      at: Path.next(col.originPath),
    });
  });
}
