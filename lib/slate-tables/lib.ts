import { createNodeId } from 'editor/plugins/withNodeId';
import { Table, TableRow, TableCell, ElementType } from 'types/slate';

export function createTableNode(props: Partial<Omit<Table, 'type'>>): Table {
  return {
    type: ElementType.Table,
    id: createNodeId(),
    children: [],
    ...props,
  };
}

export function createTableRowNode(props: Partial<Omit<TableRow, 'type'>>): TableRow {
  return {
    type: ElementType.TableRow,
    id: createNodeId(),
    children: [],
    ...props,
  };
}

export function createTableCellNode(props: Partial<Omit<TableCell, 'type'>>): TableCell {
  return {
    type: ElementType.TableCell,
    id: createNodeId(),
    children: [],
    ...props,
  };
}
