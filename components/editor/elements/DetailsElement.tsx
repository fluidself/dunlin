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
  const { isOpen } = element;
  // console.log(props);
  // console.log(isOpen);
  // const selected = useSelected();
  // const focused = useFocused();
  const editor = useSlateStatic();

  const onClickHandler = useCallback(
    (event: any) => {
      event.preventDefault();
      // event.stopPropagation();
      // console.log(event.target);
      // console.log(editor);
      // event.target.contentEditable = true;
      try {
        console.log(event.clientX);
        console.log(event.clientY);
        console.log(editor.selection);
        const targetEdge = event.target.getBoundingClientRect().left;
        const distanceFromEdge = event.clientX - targetEdge;
        console.log(targetEdge);
        console.log(distanceFromEdge);
        const path = ReactEditor.findPath(editor, element);
        console.log(path);
        const newProperties: Partial<Details> = {
          isOpen: isOpen ? false : true,
        };
        if (distanceFromEdge < 20) {
          Transforms.setNodes(editor, newProperties, { at: path });
          event.stopPropagation();
        }
        // Transforms.move(editor, { distance: 1, unit: 'offset' });
      } catch (error) {
        console.error(error);
        // const message = e instanceof Error ? e.message : e;
      }
    },
    [editor, element],
  );

  // onClick={(e: any) => e.preventDefault()}
  // open={open}
  // {...attributes}
  // className={`${className}`}

  return (
    <details onClick={onClickHandler} {...attributes} open={isOpen}>
      {/* contentEditable={true} suppressContentEditableWarning */}
      <summary>summary</summary>
      {children}
    </details>
  );
}
