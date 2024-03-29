import { memo } from 'react';
import { IconMenu2 } from '@tabler/icons';
import Tooltip from 'components/Tooltip';
import { modifierKey } from 'utils/device';
import { useStore } from 'lib/store';

type Props = {
  className?: string;
};

function OpenSidebarButton(props: Props) {
  const { className = '' } = props;
  const setIsSidebarOpen = useStore(state => state.setIsSidebarOpen);

  return (
    <Tooltip content={`Open sidebar (${modifierKey()}+\\)`} placement="right">
      <button
        aria-label="Open sidebar"
        className={`p-1 rounded hover:bg-gray-200 active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600 ${className}`}
        onClick={() => setIsSidebarOpen(true)}
      >
        <IconMenu2 size={20} className="text-gray-600 dark:text-gray-300" />
      </button>
    </Tooltip>
  );
}

export default memo(OpenSidebarButton);
