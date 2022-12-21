import { Editor, Element, Transforms, Node } from 'slate';
import { BRACKET_MAP, isListType } from 'editor/formatting';
import { ElementType } from 'types/slate';

const withCustomDeleteBackward = (editor: Editor) => {
  const { deleteBackward } = editor;

  // Convert list item to a paragraph if deleted at the beginning of the item
  editor.deleteBackward = (...args: any[]) => {
    const { selection } = editor;
    const block = Editor.above(editor, {
      match: n => Editor.isBlock(editor, n),
    });

    if (!selection || !block) {
      deleteBackward(...args);
      return;
    }

    const [lineElement, path] = block;
    const isAtLineStart = Editor.isStart(editor, selection.anchor, path);

    // The selection is at the start of the line
    if (
      isAtLineStart &&
      Element.isElement(lineElement) &&
      lineElement.type !== ElementType.Paragraph &&
      lineElement.type !== ElementType.BlockReference &&
      lineElement.type !== ElementType.TableCell
    ) {
      // If it is a list item, unwrap the list
      if (lineElement.type === ElementType.ListItem) {
        Transforms.unwrapNodes(editor, {
          match: n => !Editor.isEditor(n) && Element.isElement(n) && isListType(n['type']),
          split: true,
        });

        const isInList = Editor.above(editor, {
          match: n => !Editor.isEditor(n) && Element.isElement(n) && isListType(n['type']),
        });
        if (!isInList) {
          Transforms.setNodes(editor, { type: ElementType.Paragraph });
        }
      } else {
        // Convert to paragraph
        Transforms.setNodes(editor, { type: ElementType.Paragraph });
      }

      return;
    }

    const lineString = Node.string(lineElement);
    const characterToDelete = lineString[selection.anchor.offset - 1] ?? null;
    const nextCharacter = lineString[selection.anchor.offset] ?? null;

    if (characterToDelete && nextCharacter) {
      for (const [openingBracket, closingBracket] of Object.entries(BRACKET_MAP)) {
        if (characterToDelete === openingBracket && nextCharacter === closingBracket) {
          editor.deleteForward(...args);
        }
      }
    }

    deleteBackward(...args);
  };

  return editor;
};

export default withCustomDeleteBackward;
