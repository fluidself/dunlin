import { memo, useRef, useState } from 'react';
import { IconSettings } from '@tabler/icons';
import { usePopper } from 'react-popper';
import { Menu } from '@headlessui/react';
import Select from 'react-select';
import { DaemonModel } from 'lib/store';
import Portal from 'components/Portal';
import Tooltip from 'components/Tooltip';

const selectOptions = Object.entries(DaemonModel).map(([key, model]) => ({
  value: model,
  label: key,
}));

type SettingsMenuProps = {
  model: DaemonModel;
  setModel: (model: DaemonModel) => void;
  temperature: number;
  setTemperature: (temperature: number) => void;
};

function SettingsMenu(props: SettingsMenuProps) {
  const { model, setModel, temperature, setTemperature } = props;

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(buttonRef.current, popperElement, {
    placement: 'top-end',
  });

  return (
    <Menu>
      {({ open }) => (
        <>
          <Menu.Button
            className="rounded hover:bg-gray-100 active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600"
            ref={buttonRef}
          >
            <Tooltip content="Settings">
              <span className="flex items-center justify-center w-7 h-7">
                <IconSettings size={16} className="text-gray-600 dark:text-gray-300" />
              </span>
            </Tooltip>
          </Menu.Button>
          {open && (
            <Portal>
              <Menu.Items
                className="z-20 w-auto bg-white rounded dark:bg-gray-800 shadow-popover focus:outline-none border dark:border-gray-700"
                static
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
              >
                <div className="flex flex-col space-y-1 p-2 dark:text-gray-200 min-w-44">
                  <label htmlFor="model" className="text-sm">
                    Model
                  </label>
                  <Select
                    id="model"
                    className="react-select-container react-select-container-menu"
                    classNamePrefix="react-select"
                    options={selectOptions}
                    value={selectOptions.find(option => option.value === model)}
                    onChange={value => setModel(value?.value as DaemonModel)}
                  />
                </div>
                <div className="flex flex-col space-y-2 p-2 pb-3 dark:text-gray-200">
                  <div className="flex justify-between text-sm">
                    <label htmlFor="temperature">Temperature</label>
                    <span>{temperature}</span>
                  </div>
                  <input
                    id="temperature"
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={temperature}
                    onChange={e => setTemperature(+e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded appearance-none cursor-pointer accent-primary-500 dark:bg-gray-700"
                  />
                </div>
              </Menu.Items>
            </Portal>
          )}
        </>
      )}
    </Menu>
  );
}

export default memo(SettingsMenu);
