import { Transforms, Editor, Range } from 'slate';
import { ElementType } from 'types/slate';
import { createTable } from '../creator';

const tableAncestor = (editor: Editor) =>
  Editor.above(editor, {
    match: n => n.type === ElementType.Table,
  });

export function insertTable(editor: Editor) {
  if (!editor.selection) return;

  const existingTable = tableAncestor(editor);

  if (!existingTable && Range.isCollapsed(editor.selection)) {
    const table = createTable(3, 3);
    Transforms.insertNodes(editor, table);

    const createdTable = tableAncestor(editor);

    if (createdTable) {
      Transforms.setSelection(editor, {
        anchor: { path: [...createdTable[1], 0, 0, 0], offset: 0 },
        focus: { path: [...createdTable[1], 0, 0, 0], offset: 0 },
      });
    }
  }
}
