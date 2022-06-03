import { Editor } from 'slate';
import { ElementType } from 'types/slate';

const withCollapsible = (editor: Editor) => {
  const { isVoid } = editor;

  editor.isVoid = (element: any) => {
    return element.type === ElementType.Collapsible ? element.collapsed : isVoid(element);
  };

  return editor;
};

export default withCollapsible;
