import { ReactNode, useCallback, useState } from 'react';
import { ReactEditor, RenderElementProps, useSlateStatic, useFocused, useSelected } from 'slate-react';
import { Transforms } from 'slate';
import { Details } from 'types/slate';

type DetailsSummaryElementProps = {
  children: ReactNode;
  // element: Details;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function DetailsSummaryElement(props: DetailsSummaryElementProps) {
  const { attributes, children, className } = props;
  // const { isOpen } = element;
  // console.log(props);
  // console.log(isOpen);
  // const selected = useSelected();
  // const focused = useFocused();
  // const editor = useSlateStatic();

  return <summary {...attributes}>{children}</summary>;
}

// const Summary = ({children}) => (
//   <summary>{children}</summary>
// );
