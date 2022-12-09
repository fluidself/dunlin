import type { NodeEntry } from 'slate';
import { Node } from 'slate';
import { TableCell, TableRow } from 'types/slate';

import type { TableNode } from '../../nodes';
import { type TableRowNode, TableCellNode, getCellRowspan, getCellColspan } from '../../nodes';
import type { TablesEditor } from '../../TablesEditor';

export interface GridWithSpansRow {
  entry: NodeEntry<TableRowNode>;
  cells: GridWithSpansCell[];
}

export interface GridWithSpansCell {
  entry: NodeEntry<TableCellNode>;
  isVirtual: boolean;
}

export function createGridWithSpans(editor: TablesEditor, [, tablePath]: NodeEntry<TableNode>) {
  const grid: GridWithSpansRow[] = [];

  const tableChildren = Array.from(Node.children(editor, tablePath));
  let rowIdx = 0;

  tableChildren.forEach(([tableChild, rowPath]) => {
    if (!editor.isTableRowNode(tableChild)) return;

    const row = tableChild as TableRow;
    const rowChildren = Array.from(Node.children(editor, rowPath));
    let colIdx = 0;

    rowChildren.forEach(([rowChild, cellPath]) => {
      if (!editor.isTableCellNode(rowChild)) return;

      const cell = rowChild as TableCell;
      let colSpanIdx = 0;
      const cellRowspan = getCellRowspan(cell);

      for (let spanIdx = rowIdx; spanIdx < rowIdx + cellRowspan; spanIdx++) {
        if (!grid[spanIdx]?.cells) {
          grid[spanIdx] = { entry: [row, rowPath], cells: [] };
        }

        const cellColspan = getCellColspan(cell);

        for (colSpanIdx = 0; colSpanIdx < cellColspan; colSpanIdx++) {
          // Insert cell at first empty position
          let i = 0;

          while (grid[spanIdx]?.cells[colIdx + colSpanIdx + i]) {
            i++;
          }

          const fakeCell = colSpanIdx > 0 || spanIdx !== rowIdx;

          const y = spanIdx;
          const x = colIdx + colSpanIdx + i;

          const matrixCell: GridWithSpansCell = {
            entry: [cell, cellPath],
            isVirtual: fakeCell,
          };

          grid[y].entry = [row, rowPath];
          grid[y].cells[x] = matrixCell;
        }
      }

      colIdx += colSpanIdx;
    });

    rowIdx += 1;
  });

  return grid;
}
