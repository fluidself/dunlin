import { Editor, Transforms } from 'slate';
import type { Table, TableRow } from 'types/slate';
import { isTableNode, isTableRowNode, isTableCellNode } from 'editor/checks';
import { deserialize } from 'editor/plugins/withHtml';
import { createTableNode, createTableRowNode, createTableCellNode } from './lib';
import type { TablesEditor, TablesSchema } from './TablesEditor';
import { withNormalization } from './withNormalization';
import { withTablesDeleteBehavior, withTablesCopyPasteBehavior } from './core';
import { isInTable } from './queries';

export function withTables(editor: Editor) {
  const { insertData, insertText } = editor;

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
  }) as TablesEditor;

  tablesEditor.insertData = data => {
    const html = data.getData('text/html');
    const isSlateFragment = data.types.includes('application/x-slate-fragment');

    if (isInTable(editor) && isSlateFragment && html) {
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const fragment = deserialize(parsed.body);
      Transforms.insertFragment(editor, fragment);
      return;
    }

    insertData(data);
  };

  tablesEditor.insertText = text => {
    // Disallow pipe character to not disturb serialization to markdown
    if (isInTable(editor) && text === '|') {
      return;
    }

    insertText(text);
  };

  return withNormalization(withTablesDeleteBehavior(withTablesCopyPasteBehavior(tablesEditor)));
}
