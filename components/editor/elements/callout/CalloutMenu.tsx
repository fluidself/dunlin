import { useCallback, useMemo, useState } from 'react';
import { Transforms } from 'slate';
import { useSlateStatic } from 'slate-react';
import { IconTrash, IconX } from '@tabler/icons';
import { ElementType } from 'types/slate';
import useHotkeys from 'utils/useHotkeys';
import useOnClickOutside from 'utils/useOnClickOutside';
import { CalloutType, calloutConfig } from './config';

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
      className="flex flex-col z-10 w-60 absolute top-0 right-0 rounded bg-gray-800 border border-gray-700"
      ref={setMenuElement}
    >
      <div className="flex items-center justify-between">
        <div className="py-3 pl-4">Callout settings</div>
        <button className="mb-4 mr-1 text-gray-300 hover:text-gray-100" onClick={onClose}>
          <IconX size={18} />
        </button>
      </div>
      <div className="flex flex-col px-4 py-3 space-y-2 border-y border-gray-700">
        <label htmlFor="type">Type</label>
        <select
          id="type"
          className="input bg-gray-700 border-gray-700"
          value={selectedType}
          onChange={e => onUpdate(e.target.value as CalloutType)}
        >
          {Object.entries(calloutConfig).map(([calloutType, calloutDetails]) => (
            <option key={calloutType} value={calloutType}>
              {calloutDetails.defaultTitle}
            </option>
          ))}
        </select>
      </div>
      <button
        className="flex flex-row items-center justify-center py-3 focus:outline-none hover:bg-gray-700 active:bg-gray-600"
        autoFocus
        onClick={handleRemove}
      >
        <IconTrash size={18} className="flex-shrink-0 mr-1" />
        <span>Remove callout</span>
      </button>
    </div>
  );
}
