import { useContext, ReactNode } from 'react';
import { RenderElementProps } from 'slate-react';
import type { TableCell } from 'types/slate';
import { isHeaderCell } from 'editor/plugins/withTables';
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
    return <div {...attributes}>{children}</div>;
  }

  const headerCell = isHeaderCell(table, element);
  const Cell = headerCell ? 'th' : 'td';

  return (
    <Cell
      {...attributes}
      className={`relative w-auto min-w-[70px] h-auto border border-gray-400 px-2 py-2 align-baseline box-border outline-none ${
        headerCell && 'bg-gray-100 dark:bg-gray-800 font-semibold text-left bg-clip-padding'
      }`}
      colSpan={element.colspan}
      rowSpan={element.rowspan}
    >
      {children}
    </Cell>
  );
}
