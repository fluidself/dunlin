import { Transforms, NodeEntry, Editor } from 'slate';
import { ElementType, TableCell } from 'types/slate';
import { splitedTable, Col } from '../selection';

export function removeRow(table: NodeEntry, editor: Editor) {
  const { selection } = editor;
  if (!selection || !table) return;

  const { gridTable, getCol } = splitedTable(editor, table);

  const yIndex = table[1].length;

  const [start, end] = Editor.edges(editor, selection);
  const [startNode] = Editor.nodes<TableCell>(editor, {
    match: n => n.type === ElementType.TableCell,
    at: start,
  });

  const [endNode] = Editor.nodes<TableCell>(editor, {
    match: n => n.type === ElementType.TableCell,
    at: end,
  });

  const [startCol] = getCol((col: Col) => col.cell.id === startNode[0].id);
  const [endCol] = getCol((col: Col) => col.cell.id === endNode[0].id);

  const yTop = startCol.path[yIndex];
  const yBottom = endCol.path[yIndex];

  const topLeftCol = gridTable[yTop][0];
  const bottomRight = gridTable[yBottom][gridTable[yBottom].length - 1];

  Transforms.setSelection(editor, {
    anchor: Editor.point(editor, topLeftCol.originPath),
    focus: Editor.point(editor, bottomRight.originPath),
  });

  const { gridTable: splitedGridTable } = splitedTable(editor, table);

  const removeCols = splitedGridTable.slice(yTop, yBottom + 1).reduce((p: Col[], c: Col[]) => [...p, ...c], []) as Col[];

  removeCols.forEach((col: Col) => {
    Transforms.removeNodes(editor, {
      at: table[1],
      match: n => n.id === col.cell.id,
    });
  });

  Transforms.removeNodes(editor, {
    at: table[1],
    match: n => {
      if (n.type !== ElementType.TableRow) {
        return false;
      }

      if (!n.children || n.children.findIndex((cell: TableCell) => cell.type === ElementType.TableCell) < 0) {
        return true;
      }

      return false;
    },
  });

  if (!Editor.string(editor, table[1])) {
    Transforms.removeNodes(editor, {
      at: table[1],
    });
  }
}
