import type { Editor } from 'slate';
import type { Table, TableRow } from 'types/slate';
import { isTableNode, isTableRowNode, isTableCellNode } from 'editor/checks';
import { createTableNode, createTableRowNode, createTableCellNode } from './lib';
import type { TablesEditor, TablesSchema } from './TablesEditor';
import { withNormalization } from './withNormalization';

export function withTables<T extends Editor>(editor: T) {
  const schema: TablesSchema = {
    createContentNode: () => ({ text: '' }),
    createTableNode: ({ children, ...props }) =>
      createTableNode({
        ...props,
        children: children as Table['children'] | undefined,
      }),
    createTableRowNode: ({ children, ...props }) =>
      createTableRowNode({
        ...props,
        children: children as TableRow['children'] | undefined,
      }),
    createTableCellNode,
    isTableNode,
    isTableRowNode,
    isTableCellNode,
  };
  const tablesEditor = Object.assign(editor, {
    ...schema,
  }) as T & TablesEditor;

  return withNormalization(tablesEditor);
}
