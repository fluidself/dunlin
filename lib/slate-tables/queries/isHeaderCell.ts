import { Editor, Location, Node } from 'slate';
import type { Table, TableCell } from 'types/slate';
import type { TablesEditor } from '../TablesEditor';

export function isHeaderCell(editor: TablesEditor, location?: Location | null): boolean;
export function isHeaderCell(table: Table, cell: TableCell): boolean;
export function isHeaderCell(editorOrTable: TablesEditor | Table, locationOrCell?: (Location | null) | TableCell) {
  const { tableNode, cellNode } = findTableAndCellNodes(editorOrTable, locationOrCell);

  if (tableNode && cellNode) {
    return (
      (tableNode.header?.includes('first_row') && isFirstRow(tableNode, cellNode)) ||
      (tableNode.header?.includes('first_column') && isFirstColumn(tableNode, cellNode))
    );
  }

  return false;
}

function findTableAndCellNodes(editorOrTable: TablesEditor | Table, locationOrCell?: (Location | null) | TableCell) {
  let tableNode: Table | undefined;
  let cellNode: TableCell | undefined;

  const isEditor = Editor.isEditor(editorOrTable);
  const isLocation = Location.isLocation(locationOrCell);

  if (isEditor || isLocation || locationOrCell === null) {
    if (isEditor) {
      const editor = editorOrTable as TablesEditor;
      const location = locationOrCell ?? editor.selection;

      if (Location.isLocation(location)) {
        for (const [currentNodeToCheck] of Node.levels(editor, Editor.path(editor, location))) {
          if (editor.isTableNode(currentNodeToCheck)) {
            tableNode = currentNodeToCheck;
          }

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

function isFirstRow(table: Table, cell: TableCell): boolean {
  return table.children[0]?.children.includes(cell);
}

function isFirstColumn(table: Table, cell: TableCell): boolean {
  return table.children.some(row => row.children[0] === cell);
}
