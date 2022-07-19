import { Editor, Transforms, NodeEntry } from 'slate';
import { ElementType, TableCell } from 'types/slate';
import { splitTable, Col } from '../selection';

export function removeColumn(table: NodeEntry, editor: Editor) {
  const { selection } = editor;
  if (!selection || !table) return;

  const { getCol } = splitTable(editor, table);
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
  if (!startNode || !endNode) return;

  const [startCol] = getCol((col: Col) => col.cell.id === startNode[0].id);
  const [endCol] = getCol((col: Col) => col.cell.id === endNode[0].id);

  const xLeft = startCol.path[xIndex];
  const xRight = endCol.path[xIndex];

  const { gridTable: splitGridTable } = splitTable(editor, table);

  const removedCells = splitGridTable.reduce((p: Col[], c: Col[]) => {
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

  const { gridTable: removedGridTable } = splitTable(editor, table);

  if (!removedGridTable.length) {
    if (!Editor.string(editor, table[1])) {
      Transforms.removeNodes(editor, {
        at: table[1],
      });
    }
  }
}
