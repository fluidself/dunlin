import { ElementType, TableRow, TableCell, TableContent } from 'types/slate';
import { createNodeId } from 'editor/plugins/withNodeId';

export function createTable(columns: number, rows: number) {
  const rowNodes = [...new Array(rows)].map(() => createRow(columns));

  return {
    id: createNodeId(),
    type: ElementType.Table,
    children: rowNodes,
  };
}

export function createRow(columns: number): TableRow {
  const cellNodes = [...new Array(columns)].map(() => createCell());

  return {
    id: createNodeId(),
    type: ElementType.TableRow,
    children: cellNodes,
  };
}

export function createCell(): TableCell {
  const content = createContent();

  return {
    id: createNodeId(),
    type: ElementType.TableCell,
    children: [content],
  };
}

export function createContent(content?: string): TableContent {
  return {
    id: createNodeId(),
    type: ElementType.TableContent,
    children: [{ text: content || '' }],
  };
}
