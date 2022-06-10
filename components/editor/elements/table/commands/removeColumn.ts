import { Editor, Transforms, NodeEntry } from 'slate';
import { ElementType, TableCell } from 'types/slate';
import { splitedTable, Col } from '../selection';

export function removeColumn(table: NodeEntry, editor: Editor) {
  const { selection } = editor;
  if (!selection || !table) return;

  const { gridTable, getCol } = splitedTable(editor, table);
  const xIndex = table[1].length + 1;

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

  const xLeft = startCol.path[xIndex];
  const xRight = endCol.path[xIndex];

  const topLeftCol = gridTable[0][xLeft];
  const bottomRight = gridTable[gridTable.length - 1][xRight];

  Transforms.setSelection(editor, {
    anchor: Editor.point(editor, topLeftCol.originPath),
    focus: Editor.point(editor, bottomRight.originPath),
  });

  const { gridTable: splitedGridTable } = splitedTable(editor, table);

  const removedCells = splitedGridTable.reduce((p: Col[], c: Col[]) => {
    const cells = c.slice(xLeft, xRight + 1);
    return [...p, ...cells];
  }, []) as Col[];

  removedCells.forEach((cell: { cell: { id: string } }) => {
    Transforms.removeNodes(editor, {
      at: table[1],
      match: n => n.id === cell.cell.id,
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

  const { gridTable: removedGridTable } = splitedTable(editor, table);

  if (!removedGridTable.length) {
    const contentAfterRemove = Editor.string(editor, table[1]);

    if (!contentAfterRemove) {
      Transforms.removeNodes(editor, {
        at: table[1],
      });
    }

    return;
  }
}
