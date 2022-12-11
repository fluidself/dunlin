import { type Location, Path, Transforms, Editor } from 'slate';
import { ReactEditor } from 'slate-react';
import { Traverse } from '../core';
import { createTableCell } from '../nodes';
import type { TablesEditor } from '../TablesEditor';
import type { HorizontalSides } from '../utils/types';

export function insertColumn(
  editor: TablesEditor,
  location: Location | undefined = editor.selection ?? undefined,
  side: HorizontalSides,
) {
  if (!location) {
    return false;
  }

  const traverse = Traverse.create(editor, location);

  if (!traverse) {
    return false;
  }

  const { activeColumn } = traverse;
  let firstCellInNewColumnPath: Path | undefined = undefined;

  // As we insert cells one by one Slate calls normalization which insert empty cells
  Editor.withoutNormalizing(editor, () => {
    activeColumn.cells.forEach((columnCell, index) => {
      const at = side === 'left' ? columnCell.path : Path.next(columnCell.path);

      if (index === 0) {
        firstCellInNewColumnPath = at;
      }

      Transforms.insertNodes(editor, createTableCell(editor), { at });
    });
  });

  Editor.normalize(editor);

  ReactEditor.focus(editor);

  if (firstCellInNewColumnPath) {
    Transforms.select(editor, firstCellInNewColumnPath);
  }

  return true;
}
