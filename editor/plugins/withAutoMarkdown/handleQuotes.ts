import { Editor, Transforms, Node } from 'slate';

export const QUOTE_MAP: Record<string, string> = {
  "'": "'",
  '"': '"',
};

const handleQuotes = (editor: Editor, quote: string) => {
  const block = Editor.above(editor, { match: n => Editor.isBlock(editor, n) });
  if (!block) return false;

  const [lineElement] = block;
  const lineString = Node.string(lineElement);
  const beforeCursor = lineString.slice(0, editor.selection.anchor.offset);
  const prevCharacter = lineString[editor.selection.anchor.offset - 1] ?? null;
  const nextCharacter = lineString[editor.selection.anchor.offset] ?? null;

  if (
    (prevCharacter === quote && nextCharacter === quote) ||
    (beforeCursor.match(new RegExp(`${quote}([^${quote}]+$)`)) && nextCharacter === quote)
  ) {
    Transforms.move(editor, { unit: 'offset' });
  } else if (prevCharacter === quote) {
    return false;
  } else if ((!prevCharacter || prevCharacter.match(/\W/)) && (!nextCharacter || nextCharacter.match(/\W/))) {
    Transforms.insertText(editor, quote);
    Transforms.insertText(editor, quote);
    Transforms.move(editor, { unit: 'offset', reverse: true });
    return true;
  } else {
    return false;
  }
};

export default handleQuotes;
