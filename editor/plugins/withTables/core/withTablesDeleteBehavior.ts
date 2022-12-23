import type { Location } from 'slate';
import { Editor, Range, Point } from 'slate';
import type { TablesEditor } from '../TablesEditor';
import { isInTable } from '../queries';

export function withTablesDeleteBehavior<T extends TablesEditor>(editor: T): T {
  const { deleteBackward, deleteForward } = editor;

  editor.deleteBackward = unit => {
    if (canDeleteInTableCell(editor, Editor.start) && canDeleteBelowTable(editor)) {
      deleteBackward(unit);
    }
  };

  editor.deleteForward = unit => {
    if (canDeleteInTableCell(editor, Editor.end) && canDeleteAboveTable(editor)) {
      deleteForward(unit);
    }
  };

  return editor;
}

function canDeleteInTableCell<T extends TablesEditor>(editor: T, getEdgePoint: (editor: Editor, at: Location) => Point) {
  if (editor.selection && Range.isCollapsed(editor.selection)) {
    const [cell] = Editor.nodes(editor, {
      match: editor.isTableCellNode,
    });

    if (cell) {
      const [, cellPath] = cell;
      const edge = getEdgePoint(editor, cellPath);

      if (Point.equals(editor.selection.anchor, edge)) {
        return false;
      }
    }
  }

  return true;
}

function canDeleteBelowTable<T extends TablesEditor>(editor: T) {
  if (editor.selection && Range.isCollapsed(editor.selection)) {
    const abovePath = Editor.before(editor, editor.selection);
    if (!abovePath) return true;

    const start = Editor.start(editor, editor.selection);
    const isAtLineStart = Editor.isStart(editor, start, editor.selection);
    const [nodeAbove] = Editor.parent(editor, abovePath);

    if (!isInTable(editor) && editor.isTableCellNode(nodeAbove) && isAtLineStart) {
      return false;
    }
  }

  return true;
}

function canDeleteAboveTable<T extends TablesEditor>(editor: T) {
  if (editor.selection && Range.isCollapsed(editor.selection)) {
    const belowPath = Editor.after(editor, editor.selection);
    if (!belowPath) return true;

    const [, currentPath] = Editor.node(editor, editor.selection);
    const currentEnd = Editor.end(editor, currentPath);
    const isAtLineEnd = Editor.isEnd(editor, currentEnd, editor.selection);
    const [nodeBelow] = Editor.parent(editor, belowPath);

    if (!isInTable(editor) && editor.isTableCellNode(nodeBelow) && isAtLineEnd) {
      return false;
    }
  }

  return true;
}
