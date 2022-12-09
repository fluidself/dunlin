import { Node, Transforms } from 'slate';
import type { Path } from 'slate';
import { TableRow } from 'types/slate';
import type { TablesEditor } from '../TablesEditor';

export function removeEmptyRows(editor: TablesEditor, path: Path) {
  const table = Node.get(editor, path);

  if (!editor.isTableNode(table)) {
    return false;
  }

  for (const [child, childPath] of Node.children(editor, path)) {
    if (!editor.isTableRowNode(child)) continue;

    const row = child as TableRow;
    if (row.children.length == 0) {
      Transforms.removeNodes(editor, { at: childPath, match: n => n === row });
      return true;
    }
  }

  return false;
}
