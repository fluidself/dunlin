import { useCallback, useMemo, useState } from 'react';
import { Editor, Element, Transforms } from 'slate';
import { ReactEditor, useSlateStatic } from 'slate-react';
import { IconCornerDownRight, IconCornerUpRight, IconDotsVertical, IconLink } from '@tabler/icons';
import { ReferenceableBlockElement, ElementType } from 'types/slate';
import { isReferenceableBlockElement } from 'editor/checks';
import { createNodeId } from 'editor/plugins/withNodeId';
import Dropdown, { DropdownItem } from 'components/Dropdown';
import Portal from 'components/Portal';
import type { EmbedUrlInputState } from 'components/EmbedUrlInput';
import ChangeBlockOptions from './ChangeBlockOptions';
import UrlInputModal from './UrlInputModal';

type BlockMenuDropdownProps = {
  element: ReferenceableBlockElement;
  className?: string;
};

export default function BlockMenuDropdown(props: BlockMenuDropdownProps) {
  const { element, className = '' } = props;
  const editor = useSlateStatic();
  const [embedUrlInputState, setEmbedUrlInputState] = useState<EmbedUrlInputState>({ isOpen: false });

  const onAddBlockAbove = useCallback(() => {
    // Insert new paragraph before the current block
    const path = ReactEditor.findPath(editor, element);
    const location = Editor.before(editor, path, { unit: 'line', voids: true });
    Transforms.insertNodes(
      editor,
      {
        id: createNodeId(),
        type: ElementType.Paragraph,
        children: [{ text: '' }],
      },
      { at: location ?? [0] },
    );
  }, [editor, element]);

  const onAddBlockBelow = useCallback(() => {
    // Insert new paragraph after the current block
    const path = ReactEditor.findPath(editor, element);
    const location = Editor.after(editor, path, { unit: 'line', voids: true });
    Transforms.insertNodes(
      editor,
      {
        id: createNodeId(),
        type: ElementType.Paragraph,
        children: [{ text: '' }],
      },
      { at: location ?? Editor.end(editor, []) },
    );
  }, [editor, element]);

  const onCopyBlockRef = useCallback(() => {
    let blockId;

    // We still need this because there are cases where block ids might not exist
    if (!element.id) {
      // Generate block id if it doesn't exist
      blockId = createNodeId();
      const path = ReactEditor.findPath(editor, element);
      Transforms.setNodes(
        editor,
        { id: blockId },
        {
          at: path,
          match: n => Element.isElement(n) && isReferenceableBlockElement(n) && n.type === element.type,
        },
      );
    } else {
      // Use the existing block id
      blockId = element.id;
    }

    navigator.clipboard.writeText(`((${blockId}))`);
  }, [editor, element]);

  const buttonChildren = useMemo(
    () => (
      <span className="flex items-center justify-center w-6 h-6">
        <IconDotsVertical className="text-gray-500 dark:text-gray-400" size={18} />
      </span>
    ),
    [],
  );

  const buttonClassName = useMemo(() => {
    const buttonClassName = `select-none hover:bg-gray-200 active:bg-gray-300 rounded absolute top-0.5 dark:hover:bg-gray-800 dark:active:bg-gray-700 ${className}`;
    if (element.type === ElementType.ListItem) {
      return `${buttonClassName} -left-14`;
    } else {
      return `${buttonClassName} -left-8`;
    }
  }, [element.type, className]);

  return (
    <>
      <Dropdown
        buttonChildren={buttonChildren}
        buttonClassName={buttonClassName}
        itemsClassName="w-56 border dark:border-gray-700"
        placement="left-start"
        offset={[0, 6]}
        tooltipContent={<span className="text-xs">Click to open menu</span>}
        tooltipPlacement="bottom"
      >
        <DropdownItem className="!px-3" onClick={onAddBlockAbove}>
          <IconCornerUpRight size={18} className="mr-1" />
          <span>Add block above</span>
        </DropdownItem>
        <DropdownItem className="!px-3" onClick={onAddBlockBelow}>
          <IconCornerDownRight size={18} className="mr-1" />
          <span>Add block below</span>
        </DropdownItem>
        <DropdownItem className="!px-3" onClick={onCopyBlockRef}>
          <IconLink size={18} className="mr-1" />
          <span>Copy block reference</span>
        </DropdownItem>
        <ChangeBlockOptions
          element={element}
          setEmbedUrlInputState={setEmbedUrlInputState}
          className="px-8 border-t dark:border-gray-700"
        />
      </Dropdown>
      {embedUrlInputState.isOpen ? (
        <Portal>
          <UrlInputModal state={embedUrlInputState} setState={setEmbedUrlInputState} />
        </Portal>
      ) : null}
    </>
  );
}
