import React, { HTMLAttributes, ReactNode, useCallback, useMemo, useEffect, useState, useRef, MouseEventHandler } from 'react';
import { ReactEditor, RenderElementProps, useSelected, useSlate } from 'slate-react';
import { Editor, NodeEntry, Transforms } from 'slate';
import {
  IconRowInsertTop,
  IconRowInsertBottom,
  IconColumnInsertLeft,
  IconColumnInsertRight,
  TablerIcon,
  IconTrash,
} from '@tabler/icons';
import { ElementType, Table } from 'types/slate';
import Tooltip from 'components/Tooltip';
import { IconDeleteColumn, IconDeleteRow } from './icons';
import { insertAbove, insertBelow, insertLeft, insertRight, removeColumn, removeRow, removeTable } from './commands';
import { splitTable } from './selection';

const TABLE_CELL_OPTIONS = {
  defaultWidth: 50 as number,
  defaultHeight: 22 as number,
};

type TableElementProps = {
  element: Table;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function TableElement(props: TableElementProps) {
  const { children } = props;
  const editor = useSlate();
  const isReadOnly = ReactEditor.isReadOnly(editor);
  const isSelected = useSelected();
  const selected = isReadOnly ? false : isSelected;
  const ref = useRef<HTMLTableElement>(null);

  let table: NodeEntry | null = null;

  if (selected && editor.selection) {
    [table] = Editor.nodes(editor, {
      match: n => n.type === ElementType.Table,
      at: Editor.path(editor, editor.selection),
    });
  }

  const ResizeToolbar = useMemo(() => {
    return (
      selected &&
      ref.current &&
      table && (
        <>
          <HorizontalToolbar table={ref.current} tableNode={table} />
          <VerticalToolbar table={ref.current} tableNode={table} />
        </>
      )
    );
  }, [selected, table]);

  return (
    <div className="relative">
      <TableCardbar selected={selected} />
      {ResizeToolbar}
      <table
        className="table-fixed my-1 mx-0 overflow-auto"
        slate-table-element="table"
        ref={ref}
        onDragStart={e => e.preventDefault()}
      >
        <tbody slate-table-element="tbody">{children}</tbody>
      </table>
    </div>
  );
}

type TableCardbarProps = { selected: boolean } & HTMLAttributes<HTMLDivElement>;

const TableCardbar: React.FC<TableCardbarProps> = ({ selected }) => {
  const editor = useSlate();

  const [table] = Array.from(
    Editor.nodes(editor, {
      match: n => n.type === ElementType.Table,
    }),
  );

  const run = (action: (table: NodeEntry, editor: Editor) => void) => () => action(table, editor);

  return (
    <div
      className={`border border-gray-400 select-none pointer-events-none absolute top-[-56px] left-0 whitespace-nowrap ${
        selected ? 'block' : 'hidden'
      }`}
    >
      <div className="flex items-center justify-center pointer-events-auto">
        <CardbarButton Icon={IconRowInsertTop} onClick={run(insertAbove)} tooltip="Insert Row Above" />
        <CardbarButton Icon={IconRowInsertBottom} onClick={run(insertBelow)} tooltip="Insert Row Below" className="border-l" />
        <CardbarButton Icon={IconColumnInsertLeft} onClick={run(insertLeft)} tooltip="Insert Column Left" className="border-l" />
        <CardbarButton
          Icon={IconColumnInsertRight}
          onClick={run(insertRight)}
          tooltip="Insert Column Right"
          className="border-l"
        />
        <CardbarButton Icon={IconDeleteColumn} onClick={run(removeColumn)} tooltip="Delete Column" className="border-l" />
        <CardbarButton Icon={IconDeleteRow} onClick={run(removeRow)} tooltip="Delete Row" className="border-l" />
        <CardbarButton Icon={IconTrash} onClick={run(removeTable)} tooltip="Delete Table" className="border-l" />
      </div>
    </div>
  );
};

type CardbarButtonProps = {
  Icon: TablerIcon;
  tooltip?: string;
  className?: string;
  onClick: MouseEventHandler;
};

const CardbarButton = ({ Icon, tooltip, className = '', onClick }: CardbarButtonProps) => {
  return (
    <Tooltip content={tooltip} placement="top" disabled={!tooltip}>
      <span>
        <button
          className={`flex items-center px-2 py-2 cursor-pointer hover:bg-gray-700 active:bg-gray-600 ${className}`}
          onClick={onClick}
        >
          <Icon size={18} />
        </button>
      </span>
    </Tooltip>
  );
};

let startFromX = 0;

const HorizontalToolbar: React.FC<{
  table: HTMLElement;
  tableNode: NodeEntry;
}> = ({ table, tableNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const editor = useSlate();
  const [cols, setCols] = useState<{ width: number; el: HTMLElement[] }[]>([]);
  const widthFnObject: any = useMemo(() => ({}), []);

  useEffect(() => {
    const { gridTable = [] } = splitTable(editor, tableNode);
    if (!gridTable.length) return;

    const colsArray = [] as { width: number; el: HTMLElement[] }[];
    for (let i = 0; i < gridTable[0].length; i++) {
      for (let j = 0; j < gridTable.length; j++) {
        const currCol = gridTable[j][i];
        if (!currCol) continue;

        const td = table.querySelector(`[data-key="${currCol.cell.id}"]`) as HTMLElement;

        if (!td) continue;

        if (!colsArray[i]) {
          colsArray[i] = {
            width: 0,
            el: [],
          };
        }

        colsArray[i].width = !colsArray[i].width
          ? td.offsetWidth + td.offsetLeft
          : Math.min(colsArray[i].width, td.offsetWidth + td.offsetLeft);

        if (colsArray[i].el.findIndex(({ dataset }) => dataset.key === td.dataset.key) < 0) {
          colsArray[i].el.push(td);
        }
      }
    }

    for (let i = 1; i < colsArray.length; i++) {
      const leftSumWidth = colsArray.slice(0, i).reduce((p, c) => p + c.width, 0);
      colsArray[i].width = colsArray[i].width - leftSumWidth;
    }
    setCols(colsArray.filter(item => item.width));
  }, [editor, table, tableNode]);

  const maxWidth = useMemo(() => table.closest('div')?.offsetWidth, [table]);

  const onHandleDrag = useCallback(
    ({ item, index }) => {
      if (widthFnObject[index]) {
        return widthFnObject[index];
      }

      const fn = function (e: React.MouseEvent) {
        const changedWidth = e.clientX - startFromX;

        if (!changedWidth || !e.clientX) {
          return;
        }

        const tableWidthAfterChanged = table.offsetWidth + changedWidth;

        if (item.el && maxWidth && tableWidthAfterChanged < maxWidth) {
          const dragger = ref.current?.querySelector(`#horizontal-dragger-item-${index}`) as HTMLElement;

          if (!dragger) return;
          const draggerWidth = dragger.offsetWidth;

          if (draggerWidth + changedWidth > TABLE_CELL_OPTIONS.defaultWidth) {
            dragger.style.width = `${draggerWidth + changedWidth}px`;
          }

          const savedChangedWidth = [];
          let moreThanMinWidth = true;
          for (const cell of item.el) {
            if (cell.offsetWidth + changedWidth <= TABLE_CELL_OPTIONS.defaultWidth) {
              moreThanMinWidth = false;
              break;
            }
            savedChangedWidth.push({
              target: cell,
              width: cell.offsetWidth + changedWidth,
            });
          }

          if (moreThanMinWidth) {
            savedChangedWidth.forEach(item => {
              item.target.style.width = `${item.width}px`;
            });
          }
        }

        startFromX = e.clientX;
      };

      widthFnObject[index] = fn;
      return widthFnObject[index];
    },
    [maxWidth, table, widthFnObject],
  );

  const onHandleDragEnd = useCallback(
    (item: { width: number; el: HTMLElement[] }, index: number) => () => {
      if (item.el) {
        for (const cell of item.el) {
          Transforms.setNodes(
            editor,
            {
              width: cell.offsetWidth,
            },
            {
              at: tableNode[1],
              match: n => n.id === cell.dataset.id,
            },
          );
        }

        const dragger = ref.current?.querySelector(`#horizontal-dragger-item-${index}`) as HTMLElement;
        const draggerWidth = dragger.offsetWidth;

        const newCols = Array.from(cols);
        newCols[index] = {
          width: draggerWidth,
          el: item.el,
        };

        setCols(() => newCols);
      }
    },
    [cols, editor, tableNode],
  );

  return (
    <div contentEditable={false} className="whitespace-nowrap z-10 absolute top-[-21px] select-none" ref={ref}>
      {cols.map((item, index) => (
        <div
          key={index}
          className="h-4 inline-block border border-gray-400 relative"
          style={{ width: `${item.width}px` }}
          id={`horizontal-dragger-item-${index}`}
        >
          <div
            className="absolute right-[-4px] top-[-1px] z-10 cursor-col-resize h-4 w-1.5 hover:bg-primary-500 active:bg-transparent"
            draggable
            onMouseDown={e => {
              startFromX = e.clientX;
              document.body.addEventListener('dragover', onHandleDrag({ item, index }), false);
            }}
            onDragEnd={() => {
              document.body.removeEventListener('dragover', onHandleDrag({ item, index }));
              onHandleDragEnd(item, index);
            }}
          ></div>
        </div>
      ))}
    </div>
  );
};

let startFromY = 0;

const VerticalToolbar: React.FC<{
  table: HTMLElement;
  tableNode: NodeEntry;
}> = ({ table, tableNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const editor = useSlate();
  const [rows, setRows] = useState<{ height: number; el: HTMLElement[] }[]>([]);
  const heightFnObject: any = useMemo(() => ({}), []);

  useEffect(() => {
    const { gridTable = [] } = splitTable(editor, tableNode);
    if (!gridTable.length) return;

    const rowsArray = [] as { height: number; el: HTMLElement[] }[];

    for (let i = 0; i < gridTable.length; i++) {
      for (let j = 0; j < gridTable[i].length; j++) {
        const currCell = gridTable[i][j];
        const td = table.querySelector(`[data-key="${currCell.cell.id}"]`) as HTMLElement;

        if (!td) continue;

        if (!rowsArray[i]) {
          rowsArray[i] = {
            height: 0,
            el: [],
          };
        }

        rowsArray[i].height = !rowsArray[i].height ? td.offsetHeight : Math.min(rowsArray[i].height, td.offsetHeight);

        if (rowsArray[i].el.findIndex(({ dataset }) => dataset.key === td.dataset.key) < 0) {
          rowsArray[i].el.push(td);
        }
      }
    }

    setRows(() => rowsArray);
  }, [editor, table, tableNode]);

  const onHandleDrag = useCallback(
    ({ item, index }) => {
      if (heightFnObject[index]) {
        return heightFnObject[index];
      }

      const fn = function (e: React.MouseEvent | MouseEvent) {
        const changedHeight = e.clientY - startFromY;

        if (!changedHeight || !e.clientY) {
          return;
        }

        if (item.el) {
          const minHeight = TABLE_CELL_OPTIONS.defaultHeight;

          const dragger = ref.current?.querySelector(`#vertical-dragger-item-${index}`) as HTMLElement;

          if (!dragger) return;
          const draggerHeight = dragger.offsetHeight;

          if (draggerHeight + changedHeight > minHeight) {
            dragger.style.height = `${draggerHeight + changedHeight}px`;
          }

          const savedChangedHeight = [];
          let moreThanMinHeight = true;
          for (const cell of item.el) {
            if (cell.offsetHeight + changedHeight < minHeight) {
              moreThanMinHeight = false;
              break;
            }

            savedChangedHeight.push({
              td: cell,
              height: cell.offsetHeight + changedHeight,
            });
          }

          if (moreThanMinHeight) {
            savedChangedHeight.forEach(item => {
              item.td.style.height = `${item.height}px`;
            });
          }
        }

        startFromY = e.clientY;
      };

      heightFnObject[index] = fn;

      return heightFnObject[index];
    },
    [heightFnObject],
  );

  const onHandleDragEnd = useCallback(
    (item: { height: number; el: HTMLElement[] }, index: number) => {
      if (item.el) {
        for (const cell of item.el) {
          Transforms.setNodes(
            editor,
            {
              height: cell.offsetHeight,
            },
            {
              at: tableNode[1],
              match: n => n.id === cell.dataset.id,
            },
          );
        }

        const dragger = ref.current?.querySelector(`#vertical-dragger-item-${index}`) as HTMLElement;

        const draggerHeight = dragger.offsetHeight;

        const newRows = Array.from(rows);
        newRows[index] = {
          height: draggerHeight,
          el: item.el,
        };

        setRows(() => newRows);
      }
    },
    [rows, editor, tableNode],
  );

  return (
    <div contentEditable={false} className="z-10 absolute top-[1px] left-[-20px] select-none" ref={ref}>
      {rows.map((item, index) => (
        <div
          key={index}
          className="w-4 border border-gray-400 relative"
          style={{ height: `${item.height}px` }}
          id={`vertical-dragger-item-${index}`}
        >
          <div
            className="absolute left-0 bottom-[-4px] h-1.5 w-4 z-10 cursor-row-resize hover:bg-primary-500 active:bg-transparent"
            draggable
            onMouseDown={e => {
              startFromY = e.clientY;
              document.body.addEventListener('dragover', onHandleDrag({ item, index }), false);
            }}
            onDragEnd={() => {
              document.body.removeEventListener('dragover', onHandleDrag({ item, index }), false);
              onHandleDragEnd(item, index);
            }}
          ></div>
        </div>
      ))}
    </div>
  );
};
