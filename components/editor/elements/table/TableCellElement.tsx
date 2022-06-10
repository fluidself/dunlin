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
      {...attributes}
      className="border px-2 py-2 align-baseline box-border min-w-min"
      slate-table-element="td"
      data-key={dataKey}
      onDragStart={e => e.preventDefault()}
      style={{
        position: 'relative',
        minWidth: '50px',
        minHeight: '22px',
        width: 'auto',
        height: 'auto',
      }}
    >
      {children}
    </td>
  );
}
