import { Editor, NodeEntry, Path } from 'slate';
import { ElementType, TableCell } from 'types/slate';

export type Col = {
  cell: TableCell;
  isReal: boolean;
  path: Path;
  originPath: Path;
  isInsertPosition?: boolean;
};

export const splitedTable: (
  editor: Editor,
  table: NodeEntry,
  startKey?: string | undefined,
) => {
  tableDepth?: number;
  gridTable: Col[][];
  getCol: (match?: (node: Col) => boolean) => Col[];
} = (editor, table, startKey) => {
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
  let insertPosition = null;

  for (let i = 0; i < cells.length; i++) {
    const { cell, path, realPath } = cells[i];
    const rowspan = 1;
    const colspan = 1;
    const y = path[tableDepth];
    let x = path[tableDepth + 1];

    if (!gridTable[y]) {
      gridTable[y] = [];
    }

    while (gridTable[y][x]) {
      x++;
    }

    for (let j = 0; j < rowspan; j++) {
      for (let k = 0; k < colspan; k++) {
        const _y = y + j;
        const _x = x + k;

        if (!gridTable[_y]) {
          gridTable[_y] = [];
        }

        gridTable[_y][_x] = {
          cell,
          path: [...realPath.slice(0, tableDepth), _y, _x],
          isReal: (rowspan === 1 && colspan === 1) || (_y === y && _x === x),
          originPath: path,
        };

        if (!insertPosition && cell.id === startKey) {
          insertPosition = gridTable[_y][_x];
          gridTable[_y][_x].isInsertPosition = true;
        }
      }
    }
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
