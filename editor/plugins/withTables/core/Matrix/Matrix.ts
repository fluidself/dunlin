import type { NodeEntry } from 'slate';
import type { Table } from 'types/slate';
import type { TablesEditor } from '../../TablesEditor';
import { createGridWithSpans } from './createGridWithSpans';
import { MatrixColumn } from './MatrixColumn';
import { MatrixRow } from './MatrixRow';
import { MatrixCell } from './MatrixCell';

export class Matrix {
  public node: NodeEntry<Table>[0];
  public path: NodeEntry<Table>[1];
  public rows: MatrixRow[] = [];
  public columns: MatrixColumn[] = [];

  constructor(editor: TablesEditor, [node, path]: NodeEntry<Table>) {
    this.node = node;
    this.path = path;
    const grid = createGridWithSpans(editor, [node, path]);

    grid.forEach((gridRow, y) => {
      const matrixRow = new MatrixRow(gridRow, y, this, []);
      this.rows.push(matrixRow);

      gridRow.cells.forEach((gridCell, x) => {
        let matrixColumn = this.columns[x];

        if (!matrixColumn) {
          matrixColumn = new MatrixColumn(x, this, []);
          this.columns.push(matrixColumn);
        }

        const matrixCell = new MatrixCell(gridCell, this, matrixRow, matrixColumn, y, x);
        matrixRow.cells.push(matrixCell);
        matrixColumn.cells.push(matrixCell);
      });
    });
  }

  get width() {
    return this.columns.length;
  }

  get height() {
    return this.rows.length;
  }
}
