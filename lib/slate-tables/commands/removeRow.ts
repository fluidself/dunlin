import { type Location, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import { Traverse } from '../core';
import { getCellRowspan, calculateCellRowSpan, updateTableCell } from '../nodes';
import { TablesEditor, removeTable } from '../TablesEditor';

export function removeRow(editor: TablesEditor, location: Location | undefined = editor.selection ?? undefined) {
  if (!location) {
    return false;
  }

  const traverse = Traverse.create(editor, location);

  if (!traverse) {
    return false;
  }

  if (traverse.matrix.height === 1) {
    return removeTable(editor);
  }

  const { activeRow } = traverse;

  activeRow.cells.forEach(cell => {
    if (getCellRowspan(cell.node) > 1) {
      updateTableCell(editor, { rowspan: calculateCellRowSpan(cell.node, '-', 1) }, cell.path);
    }
  });

  Transforms.removeNodes(editor, { at: activeRow.path });

  const anchorFocusRow = activeRow.rowBelow ?? activeRow;

  const firstCell = anchorFocusRow.rowAbove.cells.at(0);

  if (firstCell) {
    Transforms.select(editor, firstCell.path);
    Transforms.collapse(editor, { edge: 'start' });
  }

  ReactEditor.focus(editor);

  return true;
}
