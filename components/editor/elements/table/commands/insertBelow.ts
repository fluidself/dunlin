import { Editor, Transforms, Path, NodeEntry } from 'slate';
import { ElementType, TableCell } from 'types/slate';
import { splitTable, Col } from '../selection';
import { createRow } from '../creator';

export function insertBelow(table: NodeEntry, editor: Editor) {
  const { selection } = editor;
  if (!selection || !table) return;

  const yIndex = table[1].length;

  const { gridTable, getCol } = splitTable(editor, table);

  const [startCell] = Editor.nodes<TableCell>(editor, {
    match: n => n.type === ElementType.TableCell,
  });

  const [insertPositionCol] = getCol((c: Col) => c.cell.id === startCell[0].id);
  const insertCols = new Map<string, Col>();
  const y = insertPositionCol.path[yIndex];
  let checkInsertEnable = true;

  gridTable[y].forEach((col: Col) => {
    const [originCol] = getCol((n: Col) => n.cell.id === col.cell.id);

    const { cell, path } = originCol;

    if (!gridTable[y + 1]) {
      insertCols.set(cell.id, originCol);
    } else if (path[yIndex] === y) {
      insertCols.set(cell.id, originCol);
    } else {
      checkInsertEnable = false;
      return;
    }
  });

  if (!checkInsertEnable) {
    return;
  }

  const newRow = createRow(insertCols.size);

  const [[, path]] = Editor.nodes(editor, {
    match: n => n.type === ElementType.TableRow,
  });

  Transforms.insertNodes(editor, newRow, {
    at: Path.next(path),
  });
}
