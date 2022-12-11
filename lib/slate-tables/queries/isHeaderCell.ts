import { Editor, Location, Node } from 'slate';

import type { TableCellNode, TableNode } from '../nodes';
import type { TablesEditor } from '../TablesEditor';

export function isHeaderCell(editor: TablesEditor, location?: Location | null): boolean;
export function isHeaderCell(table: TableNode, cell: TableCellNode): boolean;
export function isHeaderCell(editorOrTable: TablesEditor | TableNode, locationOrCell?: (Location | null) | TableCellNode) {
  const { tableNode, cellNode } = findTableAndCellNodes(editorOrTable, locationOrCell);

  if (tableNode && cellNode) {
    return (
      (tableNode.header?.includes('first_row') && isFirstRow(tableNode, cellNode)) ||
      (tableNode.header?.includes('first_column') && isFirstColumn(tableNode, cellNode))
    );
  }

  return false;
}

function findTableAndCellNodes(editorOrTable: TablesEditor | TableNode, locationOrCell?: (Location | null) | TableCellNode) {
  let tableNode: TableNode | undefined;
  let cellNode: TableCellNode | undefined;

  const isEditor = Editor.isEditor(editorOrTable);
  const isLocation = Location.isLocation(locationOrCell);

  if (isEditor || isLocation || locationOrCell === null) {
    if (isEditor) {
      const editor = editorOrTable;
      // @ts-ignore
      const location = locationOrCell ?? editor.selection;

      if (Location.isLocation(location)) {
        for (const [currentNodeToCheck] of Node.levels(editor, Editor.path(editor, location))) {
          // @ts-ignore
          if (editor.isTableNode(currentNodeToCheck)) {
            tableNode = currentNodeToCheck;
          }

          // @ts-ignore
          if (editor.isTableCellNode(currentNodeToCheck)) {
            cellNode = currentNodeToCheck;
          }

          if (tableNode && cellNode) {
            break;
          }
        }
      }
    }
  } else {
    tableNode = editorOrTable;
    cellNode = locationOrCell;
  }

  return { tableNode, cellNode };
}

function isFirstRow(table: TableNode, cell: TableCellNode): boolean {
  return table.children[0]?.children.includes(cell);
}

function isFirstColumn(table: TableNode, cell: TableCellNode): boolean {
  return table.children.some(row => row.children[0] === cell);
}
