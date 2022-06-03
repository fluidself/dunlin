import { ReactNode, useCallback } from 'react';
import { ReactEditor, RenderElementProps, useSlateStatic, useFocused, useSelected } from 'slate-react';
import { Collapsible } from 'types/slate';

type CollapsibleElementProps = {
  children: ReactNode;
  element: Collapsible;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function CollapsibleElement(props: CollapsibleElementProps) {
  const { children, attributes, element, className } = props;
  console.log(props);
  // const selected = useSelected();
  // const focused = useFocused();
  const editor = useSlateStatic();

  const onSummaryChange = useCallback(() => {
    try {
      const path = ReactEditor.findPath(editor, element);
      console.log(path);
      // const newProperties: Partial<CheckListItem> = {
      //   checked: event.target.checked,
      // };
      // Transforms.setNodes(editor, newProperties, { at: path });
    } catch (error) {
      console.error(error);
      // const message = e instanceof Error ? e.message : e;
    }
  }, [editor, element]);

  return (
    <details className={`${className}`} {...attributes}>
      <summary contentEditable={false} onClick={onSummaryChange}>
        Insert text...
      </summary>
      {children}
    </details>
  );
}
