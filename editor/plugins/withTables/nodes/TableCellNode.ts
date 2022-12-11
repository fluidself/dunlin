import type { Location } from 'slate';
import { Transforms } from 'slate';
import type { TableCell } from 'types/slate';
import type { TablesEditor } from '../TablesEditor';

const IMPLIED_COLSPAN = 1;
const IMPLIED_ROWSPAN = 1;

export function createTableCell(editor: TablesEditor, props?: Partial<TableCell>): TableCell {
  const { children, ...rest } = props ?? {};
  return editor.createTableCellNode({
    ...rest,
    children: children ?? [editor.createContentNode()],
  });
}

export function getCellColspan(cell: TableCell | undefined) {
  return cell?.colspan ?? IMPLIED_COLSPAN;
}

export function getCellRowspan(cell: TableCell | undefined) {
  return cell?.rowspan ?? IMPLIED_ROWSPAN;
}

export function calculateCellRowSpan(cell: TableCell | undefined, action: '+' | '-', amount: number) {
  const currentRowSpan = getCellRowspan(cell);
  const newRowSpan = action === '+' ? currentRowSpan + amount : currentRowSpan - amount;

  if (newRowSpan < 1) {
    return getCellRowspan(undefined);
  }

  return newRowSpan;
}

export function calculateCellColSpan(cell: TableCell | undefined, action: '+' | '-', amount: number) {
  const currentColSpan = getCellColspan(cell);
  const newColSPan = action === '+' ? currentColSpan + amount : currentColSpan - amount;

  if (newColSPan < 1) {
    return getCellColspan(undefined);
  }

  return newColSPan;
}

export function updateTableCell(editor: TablesEditor, props: Partial<Omit<TableCell, 'children'>>, location: Location) {
  Transforms.setNodes<TableCell>(editor, props, {
    at: location,
    match: node => editor.isTableCellNode(node),
  });
}
