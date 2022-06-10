import { Editor, Transforms, NodeEntry } from 'slate';
import { ElementType } from 'types/slate';

export function removeTable(table: NodeEntry, editor: Editor) {
  if (editor && table) {
    Transforms.removeNodes(editor, {
      match: n => n.type === ElementType.Table,
      at: table[1],
    });
  }
}
