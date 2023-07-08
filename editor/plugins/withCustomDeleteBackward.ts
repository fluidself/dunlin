import { Editor, Element, Transforms, Node } from 'slate';
import { DEFAULT_INDENTATION, isListType } from 'editor/formatting';
import { BRACKET_MAP } from './withAutoMarkdown/handleBrackets';
import { QUOTE_MAP } from './withAutoMarkdown/handleQuotes';
import { ElementType } from 'types/slate';

const withCustomDeleteBackward = (editor: Editor) => {
  const { deleteBackward } = editor;

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

    // Handle whitespace deletion in code blocks
    if (!isAtLineStart && Element.isElement(lineElement) && lineElement.type === ElementType.CodeLine) {
      const lineString = Node.string(lineElement);
      const beforeSelection = lineString.slice(0, selection.anchor.offset);
      const indentMatch = beforeSelection.match(new RegExp(DEFAULT_INDENTATION, 'g'))?.length || 0;
      const rest = beforeSelection.slice(DEFAULT_INDENTATION.length * indentMatch).length;

      // Preceding characters end with whitespace
      if (beforeSelection.slice(-DEFAULT_INDENTATION.length) === DEFAULT_INDENTATION) {
        Transforms.delete(editor, {
          distance: rest === 1 ? rest : DEFAULT_INDENTATION.length,
          reverse: true,
        });
        return;
      }
    }

    // Convert list item or code block to a paragraph if deleted at the beginning of the item
    if (
      isAtLineStart &&
      Element.isElement(lineElement) &&
      lineElement.type !== ElementType.Paragraph &&
      lineElement.type !== ElementType.BlockReference &&
      lineElement.type !== ElementType.TableCell
    ) {
      Editor.withoutNormalizing(editor, () => {
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
        } else if (lineElement.type === ElementType.CodeLine) {
          const abovePath = Editor.before(editor, editor.selection);
          if (!abovePath) return unwrapCodeBlock(editor);

          const [nodeAbove] = Editor.parent(editor, abovePath);
          if (nodeAbove && nodeAbove.type === ElementType.CodeLine) {
            Transforms.mergeNodes(editor, {
              match: n => !Editor.isEditor(n) && Element.isElement(n) && n['type'] === ElementType.CodeLine,
            });
          } else {
            unwrapCodeBlock(editor);
          }
        } else {
          // Convert to paragraph
          Transforms.setNodes(editor, { type: ElementType.Paragraph });
        }
      });

      return;
    }

    const lineString = Node.string(lineElement);
    const characterToDelete = lineString[selection.anchor.offset - 1] ?? null;
    const nextCharacter = lineString[selection.anchor.offset] ?? null;

    if (characterToDelete && nextCharacter) {
      for (const [openingMark, closingMark] of Object.entries({ ...BRACKET_MAP, ...QUOTE_MAP })) {
        if (characterToDelete === openingMark && nextCharacter === closingMark) {
          editor.deleteForward(...args);
        }
      }
    }

    deleteBackward(...args);
  };

  return editor;
};

const unwrapCodeBlock = (editor: Editor) => {
  Transforms.unwrapNodes(editor, {
    match: n => !Editor.isEditor(n) && Element.isElement(n) && n['type'] === ElementType.CodeBlock,
  });
  Transforms.setNodes(editor, { type: ElementType.Paragraph });
};

export default withCustomDeleteBackward;
