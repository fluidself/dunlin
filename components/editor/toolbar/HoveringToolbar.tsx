import {
  IconBold,
  IconCode,
  IconHighlight,
  IconItalic,
  IconStrikethrough,
  IconSubscript,
  IconSuperscript,
  IconUnderline,
} from '@tabler/icons';
import { memo } from 'react';
import { useFocused } from 'slate-react';
import { Mark } from 'types/slate';
import { useStore } from 'lib/store';
import { isMobile, modifierKey } from 'utils/device';
import type { AddLinkPopoverState } from '../Editor';
import type { DaemonPopoverState } from '../DaemonPopover';
import EditorPopover from '../EditorPopover';
import FormatButton from './FormatButton';
import LinkButton from './LinkButton';
import DaemonButton from './DaemonButton';

type Props = {
  setAddLinkPopoverState: (state: AddLinkPopoverState) => void;
  setDaemonPopoverState: (state: DaemonPopoverState) => void;
};

function HoveringToolbar(props: Props) {
  const { setAddLinkPopoverState, setDaemonPopoverState } = props;
  const isDaemonUser = useStore(state => state.isDaemonUser);
  const focused = useFocused();
  const key = modifierKey();

  return (
    <EditorPopover placement={isMobile() ? 'bottom-start' : 'top-start'} className={`${!focused ? 'hidden' : ''}`}>
      <LinkButton setAddLinkPopoverState={setAddLinkPopoverState} className="border-r dark:border-gray-700" />
      {isDaemonUser ? (
        <DaemonButton setDaemonPopoverState={setDaemonPopoverState} className="border-r dark:border-gray-700" />
      ) : null}
      <FormatButton format={Mark.Bold} Icon={IconBold} tooltip={`Bold (${key}+B)`} aria-label="Bold" />
      <FormatButton format={Mark.Italic} Icon={IconItalic} tooltip={`Italic (${key}+I)`} aria-label="Italic" />
      <FormatButton
        format={Mark.Underline}
        Icon={IconUnderline}
        tooltip={`Underline (${key}+U)`}
        aria-label="Underline"
      />
      <FormatButton
        format={Mark.Strikethrough}
        Icon={IconStrikethrough}
        tooltip={`Strikethrough (${key}+Shift+S)`}
        aria-label="Strikethrough"
      />
      <FormatButton format={Mark.Code} Icon={IconCode} tooltip={`Code (${key}+E)`} aria-label="Code" />
      <FormatButton
        format={Mark.Highlight}
        Icon={IconHighlight}
        tooltip={`Highlight (${key}+Shift+H)`}
        aria-label="Highlight"
      />
      <FormatButton
        format={Mark.Superscript}
        clear={Mark.Subscript}
        Icon={IconSuperscript}
        tooltip={`Superscript (${key}+Shift+,)`}
        aria-label="Superscript"
      />
      <FormatButton
        format={Mark.Subscript}
        clear={Mark.Superscript}
        Icon={IconSubscript}
        tooltip={`Subscript (${key}+Shift+.)`}
        aria-label="Subscript"
      />
    </EditorPopover>
  );
}

export default memo(HoveringToolbar);
