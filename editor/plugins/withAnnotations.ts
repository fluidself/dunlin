import { Editor } from 'slate';
import { ElementType } from 'types/slate';

const withAnnotations = (editor: Editor) => {
  const { isInline } = editor;

  editor.isInline = (element: any) => {
    return element.type === ElementType.Tag || element.type === ElementType.Footnote ? true : isInline(element);
  };

  return editor;
};

export default withAnnotations;
