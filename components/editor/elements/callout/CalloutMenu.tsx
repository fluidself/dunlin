import { useCallback, useMemo, useState } from 'react';
import { Transforms } from 'slate';
import { useSlateStatic } from 'slate-react';
import { IconTrash, IconX } from '@tabler/icons';
import Select from 'react-select';
import { ElementType } from 'types/slate';
import useHotkeys from 'utils/useHotkeys';
import useOnClickOutside from 'utils/useOnClickOutside';
import { CalloutType, calloutConfig } from './config';

const selectOptions = Object.entries(calloutConfig).map(([calloutType, calloutDetails]) => ({
  value: calloutType,
  label: calloutDetails.defaultTitle,
}));

type CalloutMenuProps = {
  selectedType: CalloutType;
  onClose: () => void;
  onUpdate: (type: CalloutType) => void;
};

export default function CalloutMenu(props: CalloutMenuProps) {
  const { selectedType, onClose, onUpdate } = props;
  const editor = useSlateStatic();
  const [menuElement, setMenuElement] = useState<HTMLDivElement | null>(null);
  useOnClickOutside(menuElement, onClose);

  const hotkeys = useMemo(
    () => [
      {
        hotkey: 'esc',
        callback: () => onClose(),
      },
    ],
    [onClose],
  );
  useHotkeys(hotkeys);

  const handleRemove = useCallback(() => {
    Transforms.removeNodes(editor, { match: n => n.type === ElementType.Callout });
  }, [editor]);

  return (
    <div
      className="flex flex-col z-10 w-60 absolute top-0 right-0 rounded shadow-popover bg-white dark:bg-gray-800 border dark:border-gray-600"
      ref={setMenuElement}
    >
      <div className="flex items-center justify-between">
        <div className="py-3 pl-4">Callout settings</div>
        <button
          className="mb-4 mr-1 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
          onClick={onClose}
        >
          <IconX size={18} />
        </button>
      </div>
      <div className="flex flex-col px-4 py-3 space-y-2 border-y dark:border-gray-700">
        <label htmlFor="type">Type</label>
        <Select
          id="type"
          className="react-select-container react-select-container-menu"
          classNamePrefix="react-select"
          menuPlacement="auto"
          options={selectOptions}
          value={selectOptions.find(option => option.value === selectedType)}
          onChange={value => onUpdate(value?.value as CalloutType)}
        />
      </div>
      <button
        className="flex flex-row items-center justify-center py-3 focus:outline-none hover:bg-gray-100 active:bg-gray-100 dark:hover:bg-gray-700 dark:active:bg-gray-600"
        autoFocus
        onClick={handleRemove}
      >
        <IconTrash size={18} className="flex-shrink-0 mr-1" />
        <span>Remove callout</span>
      </button>
    </div>
  );
}
