import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { ReactEditor, useSlate } from 'slate-react';
import { Element } from 'slate';
import {
  IconBlockquote,
  IconBraces,
  IconBrandYoutube,
  IconH1,
  IconH2,
  IconH3,
  IconLayoutSidebarRightCollapse,
  IconList,
  IconListCheck,
  IconListNumbers,
  IconMessageDots,
  IconPaperclip,
  IconPhoto,
  IconTable,
  IconTerminal2,
  IconTypography,
  TablerIcon,
} from '@tabler/icons';
import { toggleElement, isElementActive, insertDetailsDisclosure, insertCallout } from 'editor/formatting';
import { uploadAndInsertFile, uploadAndInsertImage } from 'editor/plugins/withMedia';
import { insertTable, isInTable } from 'editor/plugins/withTables';
import { ElementType } from 'types/slate';
import { useStore } from 'lib/store';
import mimeTypes from 'utils/mime-types';
import type { EmbedUrlInputState } from 'components/EmbedUrlInput';
import Tooltip from 'components/Tooltip';
import { DropdownItem } from 'components/Dropdown';

type ChangeBlockOptionsProps = {
  element: Element;
  setEmbedUrlInputState: Dispatch<SetStateAction<EmbedUrlInputState>>;
  className?: string;
};

export default function ChangeBlockOptions(props: ChangeBlockOptionsProps) {
  const { element, className = '', setEmbedUrlInputState } = props;

  return (
    <div className={`divide-y dark:divide-gray-700 ${className}`}>
      <div className="flex items-center justify-center">
        <BlockButton format={ElementType.Paragraph} element={element} Icon={IconTypography} tooltip="Paragraph" />
        <BlockButton format={ElementType.HeadingOne} element={element} Icon={IconH1} tooltip="Heading 1" />
        <BlockButton format={ElementType.HeadingTwo} element={element} Icon={IconH2} tooltip="Heading 2" />
        <BlockButton format={ElementType.HeadingThree} element={element} Icon={IconH3} tooltip="Heading 3" />
      </div>
      <div className="flex items-center justify-center">
        <BlockButton format={ElementType.BulletedList} element={element} Icon={IconList} tooltip="Bulleted list" />
        <BlockButton
          format={ElementType.NumberedList}
          element={element}
          Icon={IconListNumbers}
          tooltip="Numbered list"
        />
        <BlockButton format={ElementType.CheckListItem} element={element} Icon={IconListCheck} tooltip="Checklist" />
        <BlockButton
          format={ElementType.DetailsDisclosure}
          element={element}
          Icon={IconLayoutSidebarRightCollapse}
          tooltip="Details disclosure"
        />
      </div>
      <div className="flex items-center justify-center">
        <BlockButton format={ElementType.CodeLine} element={element} Icon={IconBraces} tooltip="Code block" />
        <BlockButton format={ElementType.Blockquote} element={element} Icon={IconBlockquote} tooltip="Blockquote" />
        <BlockButton format={ElementType.Callout} element={element} Icon={IconMessageDots} tooltip="Callout" />
        <BlockButton format={ElementType.Table} element={element} Icon={IconTable} tooltip="Table" />
      </div>
      <div className="flex items-center justify-center">
        <FileButton format={ElementType.Image} element={element} Icon={IconPhoto} onlyImages={true} tooltip="Image" />
        <EmbedButton
          format={ElementType.Video}
          element={element}
          Icon={IconBrandYoutube}
          setEmbedUrlInputState={setEmbedUrlInputState}
          tooltip="Video"
        />
        <EmbedButton
          format={ElementType.Embed}
          element={element}
          Icon={IconTerminal2}
          setEmbedUrlInputState={setEmbedUrlInputState}
          tooltip="Embed"
        />
        <FileButton
          format={ElementType.FileAttachment}
          element={element}
          Icon={IconPaperclip}
          tooltip="File attachment"
        />
      </div>
    </div>
  );
}

type BlockButtonProps = {
  format: ElementType;
  element: Element;
  Icon: TablerIcon;
  tooltip?: string;
  className?: string;
};

const BlockButton = ({ format, element, Icon, tooltip, className = '' }: BlockButtonProps) => {
  const editor = useSlate();
  const path = useMemo(() => ReactEditor.findPath(editor, element), [editor, element]);
  const isActive = isElementActive(editor, format, path);

  return (
    <Tooltip content={tooltip} placement="top" disabled={!tooltip}>
      <span>
        <DropdownItem
          className={`flex items-center px-2 py-2 cursor-pointer rounded hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600 ${className}`}
          onClick={() => {
            if (isInTable(editor)) return;

            switch (format) {
              case ElementType.DetailsDisclosure:
                insertDetailsDisclosure(editor, path);
                break;
              case ElementType.Table:
                insertTable(editor, path);
                break;
              case ElementType.Callout:
                insertCallout(editor, path);
                break;
              default:
                toggleElement(editor, format, path);
            }
          }}
        >
          <Icon
            size={18}
            className={isActive ? 'text-primary-500 dark:text-primary-400' : 'text-gray-800 dark:text-gray-200'}
          />
        </DropdownItem>
      </span>
    </Tooltip>
  );
};

type FileButtonProps = {
  onlyImages?: boolean;
} & BlockButtonProps;

const FileButton = ({ format, element, Icon, tooltip, className = '', onlyImages = false }: FileButtonProps) => {
  const editor = useSlate();
  const isOffline = useStore(state => state.isOffline);
  const path = useMemo(() => ReactEditor.findPath(editor, element), [editor, element]);
  const isActive = isElementActive(editor, format, path);

  const onClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = onlyImages ? 'image/*' : mimeTypes.join();
    input.multiple = false;
    input.className = 'absolute invisible hidden w-0 h-0';

    input.onchange = async e => {
      if (!e.target) {
        document.body.removeChild(input);
        return;
      }

      const inputElement = e.target as HTMLInputElement;

      if (!inputElement.files || inputElement.files.length <= 0) {
        document.body.removeChild(input);
        return;
      }

      if (onlyImages) {
        await uploadAndInsertImage(editor, inputElement.files[0], path);
      } else {
        await uploadAndInsertFile(editor, inputElement.files[0], path);
      }

      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  }, [editor, path, onlyImages]);

  return (
    <Tooltip content={tooltip} placement="top" disabled={!tooltip}>
      <span>
        <DropdownItem
          className={`flex items-center px-2 py-2 cursor-pointer rounded hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600 ${className}`}
          disabled={isOffline}
          onClick={onClick}
        >
          <Icon
            size={18}
            className={
              isActive && !isOffline
                ? 'text-primary-500 dark:text-primary-400'
                : isOffline
                ? 'text-gray-500 dark:text-gray-500'
                : 'text-gray-800 dark:text-gray-200'
            }
          />
        </DropdownItem>
      </span>
    </Tooltip>
  );
};

type EmbedButtonProps = {
  format: ElementType.Embed | ElementType.Video;
  setEmbedUrlInputState: Dispatch<SetStateAction<EmbedUrlInputState>>;
} & BlockButtonProps;

const EmbedButton = ({ format, element, Icon, tooltip, className = '', setEmbedUrlInputState }: EmbedButtonProps) => {
  const editor = useSlate();
  const path = useMemo(() => ReactEditor.findPath(editor, element), [editor, element]);
  const isActive = isElementActive(editor, format, path);

  return (
    <Tooltip content={tooltip} placement="top" disabled={!tooltip}>
      <span>
        <DropdownItem
          className={`flex items-center px-2 py-2 cursor-pointer rounded hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600 ${className}`}
          onClick={() => setEmbedUrlInputState({ isOpen: true, type: format, path, editor })}
        >
          <Icon
            size={18}
            className={isActive ? 'text-primary-500 dark:text-primary-400' : 'text-gray-800 dark:text-gray-200'}
          />
        </DropdownItem>
      </span>
    </Tooltip>
  );
};
