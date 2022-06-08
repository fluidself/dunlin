import { ReactNode, useCallback, useState } from 'react';
import { ReactEditor, RenderElementProps, useSlateStatic, useFocused, useSelected } from 'slate-react';
import { Transforms } from 'slate';
import { Details } from 'types/slate';

type DetailsElementProps = {
  children: ReactNode;
  element: Details;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function DetailsElement(props: DetailsElementProps) {
  const { attributes, children, element, className } = props;
  const { isOpen, summaryText } = element;
  // const selected = useSelected();
  // const focused = useFocused();
  const editor = useSlateStatic();

  const toggleOpen = useCallback(
    (event: any) => {
      // console.log(props);
      // console.log(event);
      const path = ReactEditor.findPath(editor, element);
      const newProperties: Partial<Details> = {
        isOpen: isOpen ? false : true,
      };
      Transforms.setNodes(editor, newProperties, { at: path });
    },
    [editor, isOpen],
  );

  return (
    <div className={`details ${isOpen ? 'is-open' : ''} ${className}`} contentEditable={false} {...attributes}>
      <div className="details-summary flex">
        <button className="flex cursor-pointer bg-transparent border-none p-0 focus:outline-none" onClick={toggleOpen}></button>
        <Summary
          summaryText={summaryText}
          onChange={(val: string) => {
            const path = ReactEditor.findPath(editor, element);
            const newProperties: Partial<Details> = {
              summaryText: val,
            };
            Transforms.setNodes<Details>(editor, newProperties, {
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

const Summary = ({ summaryText, onChange }: { summaryText: string; onChange: any }) => {
  const [value, setValue] = useState(summaryText);

  return (
    <input
      value={value}
      className="bg-transparent outline-none block"
      onChange={e => {
        const newSummaryText = e.target.value;
        setValue(newSummaryText);
        onChange(newSummaryText);
      }}
    />
  );
};
