import type { Element, Location } from 'slate';
import { Editor, Transforms } from 'slate';
import type { TableHeader } from 'types/slate';
import { Traverse } from '../core';
import type { TablesEditor } from '../TablesEditor';
import { TableRowNode, createTableRow } from './TableRowNode';

// @ts-ignore
export interface TableNode extends Element {
  children: TableRowNode[];
  border?: boolean;
  header?: TableHeader[];
}

export function createTable(
  editor: TablesEditor,
  props?: Partial<Omit<TableNode, 'children'>> & {
    rowsCount?: number;
    columnsCount?: number;
  },
): TableNode {
  const { rowsCount = 3, columnsCount = 3, ...rest } = props ?? {};
  const rows = Array.from(Array(rowsCount)).map(() => createTableRow(editor, { children: columnsCount }));
  return editor.createTableNode({
    ...rest,
    header: ['first_row'],
    children: rows,
  });
}

export function updateTable(
  editor: TablesEditor,
  props: Partial<Omit<TableNode, 'children'>>,
  location: Location | undefined = editor.selection ?? undefined,
) {
  Transforms.setNodes<TableNode>(editor, props, {
    at: location,
    match: node => editor.isTableNode(node),
  });
}

export function toggleTableHeader(
  editor: TablesEditor,
  location: Location | undefined = editor.selection ?? undefined,
  headerType: TableHeader,
) {
  if (!location) {
    return undefined;
  }

  const traverse = Traverse.create(editor, location);

  if (!traverse) {
    return undefined;
  }

  const isAlreadyEnabled = traverse.matrix.node.header?.includes(headerType);
  const newHeader = isAlreadyEnabled
    ? traverse.matrix.node.header?.filter(h => h !== headerType)
    : [...(traverse.matrix.node.header ?? []), headerType];

  Transforms.setNodes<TableNode>(
    editor,
    { header: newHeader },
    {
      at: location,
      match: n => n === traverse.matrix.node,
    },
  );

  // When we mark text in cell as bold and then mark the first row as header the normalization is not called
  // and bold mark still present in cell content
  Editor.normalize(editor, { force: true });

  return newHeader;
}
