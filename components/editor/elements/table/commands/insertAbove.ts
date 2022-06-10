import { Editor, Transforms, NodeEntry } from 'slate';
import { ElementType, TableCell } from 'types/slate';
import { splitedTable, Col } from '../selection';
import { createRow } from '../creator';

export function insertAbove(table: NodeEntry, editor: Editor) {
  const { selection } = editor;
  if (!selection || !table) return;

  const yIndex = table[1].length;

  const { gridTable, getCol } = splitedTable(editor, table);

  const [startCell] = Editor.nodes<TableCell>(editor, {
    match: n => n.type === ElementType.TableCell,
  });

  const [insertPositionCol] = getCol((c: Col) => c.cell.id === startCell[0].id && c.isReal);

  let checkInsertEnable = true;
  const insertYIndex = insertPositionCol.path[yIndex];
  const insertCols = new Map<string, Col>();

  gridTable[insertYIndex].forEach((col: Col) => {
    if (!col.isReal) {
      const [originCol] = getCol((c: Col) => c.isReal && c.cell.id === col.cell.id);

      if (originCol.path[yIndex] === insertYIndex) {
        insertCols.set(originCol.cell.id, originCol);
      } else {
        checkInsertEnable = false;
        return;
      }
    } else {
      insertCols.set(col.cell.id, col);
    }
  });

  if (!checkInsertEnable) {
    return;
  }

  const newRow = createRow(insertCols.size);

  const [[, path]] = Editor.nodes(editor, {
    match: n => n.type === 'table-row',
  });

  Transforms.insertNodes(editor, newRow, {
    at: path,
  });
}
