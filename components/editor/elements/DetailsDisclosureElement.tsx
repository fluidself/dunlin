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
  const { summaryText } = element;
  const editor = useSlateStatic();
  const [open, setOpen] = useState(false);
  const isReadOnly = ReactEditor.isReadOnly(editor);

  const deleteElement = useCallback(() => {
    const path = ReactEditor.findPath(editor, element);
    const newProperties: Partial<ParagraphElement> = { type: ElementType.Paragraph };

    Transforms.setNodes<ParagraphElement>(editor, newProperties, {
      at: path,
    });
  }, [editor, element]);

  return (
    <div className={`details ${className} ${open ? 'is-open' : ''}`} {...attributes}>
      <div className="details-summary flex" contentEditable={false}>
        <button
          className="flex cursor-pointer bg-transparent border-none p-0 focus:outline-none"
          onClick={() => (open ? setOpen(false) : setOpen(true))}
        ></button>
        <Summary
          summaryText={summaryText}
          isReadOnly={isReadOnly}
          onDelete={deleteElement}
          onChange={value => {
            const path = ReactEditor.findPath(editor, element);
            const newProperties: Partial<DetailsDisclosure> = { summaryText: value };

            Transforms.setNodes<DetailsDisclosure>(editor, newProperties, {
              at: path,
            });
          }}
        />
      </div>
      <div
        className="ml-[22px] mt-1 outline-none"
        hidden={!open}
        contentEditable={!isReadOnly && open}
        suppressContentEditableWarning
      >
        {children}
      </div>
    </div>
  );
}

type SummaryProps = {
  summaryText: string;
  isReadOnly: boolean;
  onChange: (value: string) => void;
  onDelete: () => void;
};

const Summary = ({ summaryText, isReadOnly, onChange, onDelete }: SummaryProps) => {
  const [value, setValue] = useState(summaryText);

  return (
    <input
      value={value}
      disabled={isReadOnly}
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
