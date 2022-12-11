import type { Editor, Element, Location, Node, Text } from 'slate';
import type { ReactEditor } from 'slate-react';
import type { Table, TableRow, TableCell } from 'types/slate';
import * as TableCommands from './commands';
import { createTable, updateTable, toggleTableHeader, createTableRow, createTableCell } from './nodes';
import * as TableQueries from './queries';

export interface TablesSchema {
  createContentNode: () => Element | Text;
  createTableNode: (props: Partial<Table>) => Table;
  createTableRowNode: (props: Partial<TableRow>) => TableRow;
  createTableCellNode: (props: Partial<TableCell>) => TableCell;
  isTableNode: (node: Node) => node is Table;
  isTableRowNode: (node: Node) => node is TableRow;
  isTableCellNode: (node: Node) => node is TableCell;
}

export interface TablesEditor extends TablesSchema, ReactEditor {}

export const insertTable = TableCommands.insertTable;
export const removeColumn = TableCommands.removeColumn;
export const removeRow = TableCommands.removeRow;
export const removeTable = TableCommands.removeTable;

export const findParentCell = TableQueries.findParentCell;
export const findParentTable = TableQueries.findParentTable;
export const isHeaderCell = TableQueries.isHeaderCell;
export const isInTable = TableQueries.isInTable;

export { createTable, updateTable, toggleTableHeader, createTableRow, createTableCell };

export function insertColumnLeft(editor: TablesEditor, location?: Location) {
  return TableCommands.insertColumn(editor, location, 'left');
}

export function insertColumnRight(editor: TablesEditor, location?: Location) {
  return TableCommands.insertColumn(editor, location, 'right');
}

export function insertRowAbove(editor: TablesEditor, location?: Location) {
  return TableCommands.insertRow(editor, location, 'above');
}

export function insertRowBelow(editor: TablesEditor, location?: Location) {
  return TableCommands.insertRow(editor, location, 'below');
}

export function isTablesEditor(editor: Editor): editor is TablesEditor {
  return 'isTableCellNode' in editor;
}
