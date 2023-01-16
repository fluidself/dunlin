import { IconBold, IconItalic, IconUnderline, IconStrikethrough, IconCode, IconHighlight } from '@tabler/icons';
import { memo } from 'react';
import { Mark } from 'types/slate';
import { isMobile, modifierKey } from 'utils/device';
import type { AddLinkPopoverState } from '../Editor';
import EditorPopover from '../EditorPopover';
import FormatButton from './FormatButton';
import LinkButton from './LinkButton';

type Props = {
  setAddLinkPopoverState: (state: AddLinkPopoverState) => void;
};

function HoveringToolbar(props: Props) {
  const { setAddLinkPopoverState } = props;
  const key = modifierKey();

  return (
    <EditorPopover placement={isMobile() ? 'bottom-start' : 'top-start'}>
      <LinkButton setAddLinkPopoverState={setAddLinkPopoverState} className="border-r dark:border-gray-700" />
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
    </EditorPopover>
  );
}

export default memo(HoveringToolbar);
