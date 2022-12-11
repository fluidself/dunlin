import type { Location } from 'slate';
import { Transforms } from 'slate';
import type { TableRow, TableCell } from 'types/slate';
import type { TablesEditor } from '../TablesEditor';
import { createTableCell } from './TableCellNode';

export function createTableRow(
  editor: TablesEditor,
  props?: Partial<Omit<TableRow, 'children'> & { children: TableCell[] | number }>,
): TableRow {
  const { children, ...rest } = props ?? {};
  return editor.createTableRowNode({
    ...rest,
    children: typeof children === 'number' ? Array.from(Array(children)).map(() => createTableCell(editor)) : children ?? [],
  });
}

export function updateTableRow(editor: TablesEditor, props: Partial<Omit<TableRow, 'children'>>, location: Location) {
  Transforms.setNodes<TableRow>(editor, props, {
    at: location,
    match: node => editor.isTableRowNode(node),
  });
}
