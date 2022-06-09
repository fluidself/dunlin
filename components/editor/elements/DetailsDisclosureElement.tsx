import { ReactNode, useCallback, useState } from 'react';
import { ReactEditor, RenderElementProps, useSlateStatic } from 'slate-react';
import { Transforms } from 'slate';
import { DetailsDisclosure, ElementType, ParagraphElement } from 'types/slate';

type DetailsDisclosureElementProps = {
  children: ReactNode;
  element: DetailsDisclosure;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function DetailsDisclosureElement(props: DetailsDisclosureElementProps) {
  const { attributes, children, element, className } = props;
  const { isOpen, summaryText } = element;
  const editor = useSlateStatic();

  const toggleOpen = useCallback(() => {
    const path = ReactEditor.findPath(editor, element);
    const newProperties: Partial<DetailsDisclosure> = {
      isOpen: isOpen ? false : true,
    };

    Transforms.setNodes(editor, newProperties, { at: path });
  }, [editor, element, isOpen]);

  const deleteElement = useCallback(() => {
    const path = ReactEditor.findPath(editor, element);
    const newProperties: Partial<ParagraphElement> = { type: ElementType.Paragraph };

    Transforms.setNodes<ParagraphElement>(editor, newProperties, {
      at: path,
    });
  }, [editor, element]);

  return (
    <div className={`details ${className} ${isOpen ? 'is-open' : ''}`} {...attributes}>
      <div className="details-summary flex" contentEditable={false}>
        <button className="flex cursor-pointer bg-transparent border-none p-0 focus:outline-none" onClick={toggleOpen}></button>
        <Summary
          summaryText={summaryText}
          onDelete={deleteElement}
          onChange={(val: string) => {
            const path = ReactEditor.findPath(editor, element);
            const newProperties: Partial<DetailsDisclosure> = { summaryText: val };

            Transforms.setNodes<DetailsDisclosure>(editor, newProperties, {
              at: path,
            });
          }}
        />
      </div>
      <div className="ml-[22px] mt-1 outline-none" hidden={!isOpen} contentEditable={isOpen} suppressContentEditableWarning>
        {children}
      </div>
    </div>
  );
}

const Summary = ({ summaryText, onChange, onDelete }: { summaryText: string; onChange: any; onDelete: any }) => {
  const [value, setValue] = useState(summaryText);

  return (
    <input
      value={value}
      className="bg-transparent outline-none block w-full"
      placeholder="Details"
      onKeyDown={e => {
        if (e.key === 'Backspace' && value === '') {
          onDelete();
        }
      }}
      onChange={e => {
        const newSummaryText = e.target.value;
        setValue(newSummaryText);
        onChange(newSummaryText);
      }}
    />
  );
};
