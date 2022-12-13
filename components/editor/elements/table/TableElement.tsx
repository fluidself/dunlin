import { ReactNode } from 'react';
import { RenderElementProps, useSlateStatic, useSelected, ReactEditor } from 'slate-react';
import type { Table } from 'types/slate';
import { TableContext } from './TableContext';
import TableToolbar from './TableToolbar';

type Props = {
  element: Table;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function TableElement({ attributes, element, children }: Props) {
  const editor = useSlateStatic();
  const isReadOnly = ReactEditor.isReadOnly(editor);
  const isSelected = useSelected();
  const selected = isReadOnly ? false : isSelected;

  return (
    <div {...attributes}>
      <TableContext.Provider value={{ table: element }}>
        <div className="relative">
          <TableToolbar selected={selected} />
          <table className="table-auto my-1 mx-0 overflow-auto border-collapse">
            <tbody>{children}</tbody>
          </table>
        </div>
      </TableContext.Provider>
    </div>
  );
}
