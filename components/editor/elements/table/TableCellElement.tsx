import { ReactNode } from 'react';
import { RenderElementProps } from 'slate-react';
import { TableCell } from 'types/slate';

type Props = {
  element: TableCell;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function TableCellElement(props: Props) {
  const { attributes, children, element } = props;
  const dataKey = element.id;

  return (
    <td
      className="relative min-w-[50px] min-h-[22px] w-auto h-auto border border-gray-400 px-2 py-2 align-baseline box-border"
      slate-table-element="td"
      data-key={dataKey}
      {...attributes}
    >
      {children}
    </td>
  );
}
