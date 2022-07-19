import { Editor, NodeEntry, Path } from 'slate';
import { ElementType, TableCell } from 'types/slate';

export type Col = {
  cell: TableCell;
  path: Path;
};

export const splitTable: (
  editor: Editor,
  table: NodeEntry,
) => {
  tableDepth?: number;
  gridTable: Col[][];
  getCol: (match?: (node: Col) => boolean) => Col[];
} = (editor, table) => {
  const tableDepth = table[1].length;

  const cells = [] as { cell: TableCell; path: Path; realPath: Path }[];

  const nodes = Editor.nodes(editor, {
    at: table[1],
    match: n => n.type === ElementType.TableCell,
  });

  for (const node of nodes) {
    const [cell, path] = node as [TableCell, Path];
    cells.push({
      cell,
      path,
      realPath: [...path],
    });
  }

  const gridTable: Col[][] = [];

  for (let i = 0; i < cells.length; i++) {
    const { cell, path, realPath } = cells[i];
    const y = path[tableDepth];
    let x = path[tableDepth + 1];

    if (!gridTable[y]) {
      gridTable[y] = [];
    }

    while (gridTable[y][x]) {
      x++;
    }

    gridTable[y][x] = {
      cell,
      path: [...realPath.slice(0, tableDepth), y, x],
    };
  }

  const getCol = (match?: (node: Col) => boolean): Col[] => {
    const result: Col[] = [];

    gridTable.forEach(row => {
      row.forEach((col: Col) => {
        if (match && match(col)) {
          result.push(col);
        }
      });
    });

    return result;
  };

  return {
    gridTable,
    tableDepth,
    getCol,
  };
};
