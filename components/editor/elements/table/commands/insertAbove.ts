import { Editor, Transforms, NodeEntry } from 'slate';
import { ElementType, TableCell } from 'types/slate';
import { splitTable, Col } from '../selection';
import { createRow } from '../creator';

export function insertAbove(table: NodeEntry, editor: Editor) {
  const { selection } = editor;
  if (!selection || !table) return;

  const yIndex = table[1].length;

  const { gridTable, getCol } = splitTable(editor, table);

  const [startCell] = Editor.nodes<TableCell>(editor, {
    match: n => n.type === ElementType.TableCell,
  });

  const [insertPositionCol] = getCol((c: Col) => c.cell.id === startCell[0].id);
  const insertYIndex = insertPositionCol.path[yIndex];
  const insertCols = new Map<string, Col>();

  gridTable[insertYIndex].forEach((col: Col) => {
    insertCols.set(col.cell.id, col);
  });

  const newRow = createRow(insertCols.size);

  const [[, path]] = Editor.nodes(editor, {
    match: n => n.type === ElementType.TableRow,
  });

  Transforms.insertNodes(editor, newRow, {
    at: path,
  });
}
