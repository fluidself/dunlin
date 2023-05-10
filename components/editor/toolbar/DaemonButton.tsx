import { memo } from 'react';
import { useSlateStatic } from 'slate-react';
import { IconGhost2 } from '@tabler/icons';
import { modifierKey } from 'utils/device';
import type { DaemonPopoverState } from '../DaemonPopover';
import ToolbarButton from './ToolbarButton';

type DaemonButtonProps = {
  setDaemonPopoverState: (state: DaemonPopoverState) => void;
  className?: string;
};

const DaemonButton = (props: DaemonButtonProps) => {
  const { setDaemonPopoverState, className = '' } = props;
  const editor = useSlateStatic();

  return (
    <ToolbarButton
      icon={IconGhost2}
      tooltip={`Ask daemon (${modifierKey()}+J)`}
      className={className}
      onClick={() => {
        if (editor.selection) {
          setDaemonPopoverState({
            isVisible: true,
            selection: editor.selection,
          });
        }
      }}
    />
  );
};

export default memo(DaemonButton);
