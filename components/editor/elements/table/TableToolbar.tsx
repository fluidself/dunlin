import { MouseEventHandler } from 'react';
import { useSlateStatic } from 'slate-react';
import {
  IconRowInsertTop,
  IconRowInsertBottom,
  IconColumnInsertLeft,
  IconColumnInsertRight,
  TablerIcon,
  IconTrash,
  IconLayoutNavbar,
} from '@tabler/icons';
import {
  insertRowAbove,
  insertRowBelow,
  insertColumnLeft,
  insertColumnRight,
  removeColumn,
  removeRow,
  toggleTableHeader,
  removeTable,
} from 'editor/plugins/withTables';
import Tooltip from 'components/Tooltip';
import { IconDeleteColumn, IconDeleteRow } from './icons';

type TableMenuProps = {
  selected: boolean;
};

export default function TableToolbar({ selected }: TableMenuProps) {
  const editor = useSlateStatic();

  const buttonBorderClass = 'border-l dark:border-gray-600';

  return (
    <div
      className={`bg-white dark:bg-gray-800 border dark:border-gray-600 shadow-popover select-none pointer-events-none absolute top-[-43px] left-0 whitespace-nowrap rounded ${
        selected ? 'block' : 'hidden'
      }`}
    >
      <div className="flex items-center justify-center pointer-events-auto">
        <TableToolbarButton Icon={IconRowInsertTop} tooltip="Insert row above" onClick={() => insertRowAbove(editor)} />
        <TableToolbarButton
          Icon={IconRowInsertBottom}
          tooltip="Insert row below"
          className={buttonBorderClass}
          onClick={() => insertRowBelow(editor)}
        />
        <TableToolbarButton
          Icon={IconColumnInsertLeft}
          tooltip="Insert column left"
          className={buttonBorderClass}
          onClick={() => insertColumnLeft(editor)}
        />
        <TableToolbarButton
          Icon={IconColumnInsertRight}
          tooltip="Insert column right"
          className={buttonBorderClass}
          onClick={() => insertColumnRight(editor)}
        />
        <TableToolbarButton
          Icon={IconDeleteColumn}
          tooltip="Delete column"
          className={buttonBorderClass}
          onClick={() => removeColumn(editor)}
        />
        <TableToolbarButton
          Icon={IconDeleteRow}
          tooltip="Delete row"
          className={buttonBorderClass}
          onClick={() => removeRow(editor)}
        />
        <TableToolbarButton
          Icon={IconLayoutNavbar}
          tooltip="Toggle header"
          className={buttonBorderClass}
          onClick={() => toggleTableHeader(editor, undefined, 'first_row')}
        />
        <TableToolbarButton
          Icon={IconTrash}
          tooltip="Delete table"
          className={buttonBorderClass}
          onClick={() => removeTable(editor)}
        />
      </div>
    </div>
  );
}

type TableToolbarButtonProps = {
  Icon: TablerIcon;
  tooltip?: string;
  className?: string;
  onClick: MouseEventHandler;
};

function TableToolbarButton({ Icon, tooltip, className = '', onClick }: TableToolbarButtonProps) {
  return (
    <Tooltip content={tooltip} placement="top" disabled={!tooltip}>
      <span>
        <button
          className={`flex items-center px-2 py-2 cursor-pointer hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600 ${className}`}
          onClick={onClick}
        >
          <Icon size={18} />
        </button>
      </span>
    </Tooltip>
  );
}
