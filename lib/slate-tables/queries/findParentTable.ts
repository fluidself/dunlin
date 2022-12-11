import { type Location, type NodeEntry, type Selection, Editor } from 'slate';
import type { Table } from 'types/slate';
import type { TablesEditor } from '../TablesEditor';

export function findParentTable<T extends Table>(
  editor: TablesEditor,
  location: Location | Selection = editor.selection,
): NodeEntry<T> | undefined {
  if (!location) {
    return undefined;
  }
  for (const entry of Editor.levels(editor, { at: location })) {
    if (editor.isTableNode(entry[0])) {
      return entry as NodeEntry<T>;
    }
  }

  return undefined;
}
