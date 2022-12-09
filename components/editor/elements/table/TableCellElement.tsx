import { useContext, ReactNode } from 'react';
import type { RenderElementProps } from 'slate-react';
import { TableCell } from 'types/slate';
import { isHeaderCell } from 'lib/slate-tables';
import { TableContext } from './TableContext';

type Props = {
  element: TableCell;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function TableCellElement({ attributes, element, children }: Props) {
  const { table } = useContext(TableContext);

  if (!table) {
    console.warn(`${TableCellElement.name} requires wrapping in TableContext.`);
    return null;
  }

  const headerCell = isHeaderCell(table, element);
  const Cell = headerCell ? 'th' : 'td';

  return (
    <Cell
      {...attributes}
      className={`relative min-w-[40px] min-h-[22px] w-auto h-auto border border-gray-400 px-2 py-2 align-baseline box-border outline-none ${
        headerCell && 'bg-gray-800 font-semibold text-left'
      }`}
      colSpan={element.colspan}
      rowSpan={element.rowspan}
    >
      {children}
    </Cell>
  );
}
