import { Editor, Element } from 'slate';
import { ElementType } from 'types/slate';

const VOID_ELEMENTS: Array<ElementType> = [
  ElementType.NoteLink,
  ElementType.Footnote,
  ElementType.Tag,
  ElementType.ThematicBreak,
  ElementType.Image,
  ElementType.Video,
  ElementType.Embed,
  ElementType.FileAttachment,
  ElementType.BlockReference,
  ElementType.MermaidDiagram,
  ElementType.Callout,
];

const withVoidElements = (editor: Editor) => {
  const { isVoid: slateIsVoid } = editor;

  editor.isVoid = (element: any) => {
    return isVoid(element) ? true : slateIsVoid(element);
  };

  return editor;
};

export const isVoid = (element: Element) => {
  return VOID_ELEMENTS.indexOf(element.type) !== -1;
};

export default withVoidElements;
