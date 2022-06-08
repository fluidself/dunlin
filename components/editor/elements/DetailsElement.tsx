import { ReactNode, useCallback, useState } from 'react';
import { ReactEditor, RenderElementProps, useSlateStatic, useFocused, useSelected } from 'slate-react';
import { Transforms } from 'slate';
import { Details } from 'types/slate';
import { IconArrowLeft } from '@tabler/icons';

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
  console.log(isOpen);
  // const selected = useSelected();
  // const focused = useFocused();
  const editor = useSlateStatic();

  const toggleOpen = useCallback(
    (event: any) => {
      console.log(props);
      console.log(event);
      const path = ReactEditor.findPath(editor, element);
      const newProperties: Partial<Details> = {
        isOpen: isOpen ? false : true,
      };
      Transforms.setNodes(editor, newProperties, { at: path });
    },
    [editor, isOpen],
  );

  // const onClickHandler = useCallback(
  //   (event: any) => {
  //     event.preventDefault();
  //     // event.stopPropagation();
  //     // console.log(event.target);
  //     // console.log(editor);
  //     // event.target.contentEditable = true;
  //     try {
  //       console.log(event.clientX);
  //       console.log(event.clientY);
  //       console.log(editor.selection);
  //       const targetEdge = event.target.getBoundingClientRect().left;
  //       const distanceFromEdge = event.clientX - targetEdge;
  //       console.log(targetEdge);
  //       console.log(distanceFromEdge);
  //       const path = ReactEditor.findPath(editor, element);
  //       console.log(path);
  //       const newProperties: Partial<Details> = {
  //         isOpen: isOpen ? false : true,
  //       };
  //       if (distanceFromEdge < 20) {
  //         Transforms.setNodes(editor, newProperties, { at: path });
  //         // Transforms.select(editor, {
  //         //   anchor: { path: [0, 0], offset: 6 },
  //         //   focus: { path: [0, 0], offset: 6 },
  //         // });
  //         event.stopPropagation();
  //       }
  //       // Transforms.move(editor, { distance: 1, unit: 'offset' });
  //       // Transforms.select(editor, {
  //       //   anchor: { path: [0, 0], offset: 6 },
  //       //   focus: { path: [0, 0], offset: 6 },
  //       // });
  //     } catch (error) {
  //       console.error(error);
  //       // const message = e instanceof Error ? e.message : e;
  //     }
  //   },
  //   [editor, element],
  // );

  // onClick={(e: any) => e.preventDefault()}
  // open={open}
  // {...attributes}
  // className={`${className}`}

  return (
    // onClick={onClickHandler}
    <div className={`details ${isOpen ? 'is-open' : ''}`} {...attributes}>
      <button contentEditable={false} onClick={toggleOpen}></button>
      <summary>summae</summary>
      <div hidden={!isOpen}>{children}</div>
    </div>
  );

  // return (
  //   <div className="details" {...attributes}>
  //     <div className="flex">
  //       <button onClick={onClickHandler}>{<IconArrowLeft />}</button>
  //       <div className="summary">summary goes here</div>
  //     </div>

  //     {children}
  //   </div>
  // );
}

// const Summary = ({children}) => (
//   <summary>{children}</summary>
// );
