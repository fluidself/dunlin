import { type Location, Transforms, Editor } from 'slate';
import { ReactEditor } from 'slate-react';
import { Traverse } from '../core';
import { getCellColspan, updateTableCell, calculateCellColSpan } from '../nodes';
import { TablesEditor, removeTable } from '../TablesEditor';

export function removeColumn(editor: TablesEditor, location: Location | undefined = editor.selection ?? undefined) {
  if (!location) {
    return false;
  }

  const traverse = Traverse.create(editor, location);

  if (!traverse) {
    return false;
  }

  const { activeColumn } = traverse;
  const { columnLeft } = activeColumn;

  if (traverse.matrix.width === 1) {
    return removeTable(editor);
  }

  // As we remove cells one by one Slate calls normalization which insert empty cells
  Editor.withoutNormalizing(editor, () => {
    activeColumn.cells.forEach(cell => {
      if (getCellColspan(cell.node) > 1) {
        updateTableCell(editor, { colspan: calculateCellColSpan(cell.node, '-', 1) }, cell.path);
      } else {
        Transforms.removeNodes(editor, { at: cell.path });
      }
    });
  });

  Editor.normalize(editor);

  let anchorFocusColumn = activeColumn;

  if (activeColumn.isLast && columnLeft) {
    anchorFocusColumn = columnLeft;
  }

  const firstCell = anchorFocusColumn.cells.at(0);

  if (firstCell) {
    Transforms.select(editor, firstCell.path);
    Transforms.collapse(editor, { edge: 'start' });
  }

  ReactEditor.focus(editor);

  return true;
}
