import { Editor, Transforms, Node } from 'slate';

export const BRACKET_MAP: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
};

const handleBrackets = (editor: Editor, openingBracket: string) => {
  const block = Editor.above(editor, { match: n => Editor.isBlock(editor, n) });
  if (!block) return false;

  const [lineElement] = block;
  const lineString = Node.string(lineElement);
  const nextCharacter = lineString[editor.selection.anchor.offset] ?? null;
  const closingBracket = BRACKET_MAP[openingBracket];

  if (!nextCharacter || nextCharacter.match(/\s|\)|\]|}/)) {
    Transforms.insertText(editor, openingBracket);
    Transforms.insertText(editor, closingBracket);
    Transforms.move(editor, { unit: 'offset', reverse: true });
    return true;
  } else {
    return false;
  }
};

export default handleBrackets;
