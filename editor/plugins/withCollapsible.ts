import { Editor } from 'slate';
import { ElementType } from 'types/slate';

const withCollapsible = (editor: Editor) => {
  const { isVoid } = editor;

  editor.isVoid = (element: any) => {
    return element.type === ElementType.DetailsDisclosure ? !element.isOpen : isVoid(element);
  };

  return editor;
};

export default withCollapsible;
