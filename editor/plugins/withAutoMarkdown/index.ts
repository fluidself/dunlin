import { Editor, Element } from 'slate';
import { ElementType } from 'types/slate';
import { store } from 'lib/store';
import handleBlockShortcuts from './handleBlockShortcuts';
import handleInlineShortcuts from './handleInlineShortcuts';
import handleBrackets, { BRACKET_MAP } from './handleBrackets';
import handleQuotes, { QUOTE_MAP } from './handleQuotes';

// Add auto-markdown formatting shortcuts
const withAutoMarkdown = (editor: Editor) => {
  const { insertText, insertData } = editor;

  editor.insertText = (text: any) => {
    const handled = handleAutoMarkdown(editor, text);
    if (!handled) {
      insertText(text);
    }
  };

  editor.insertData = (data: any) => {
    const text = data.getData('text/plain');
    const handled = handleAutoMarkdown(editor, text);
    if (!handled) {
      insertData(data);
    }
  };

  return editor;
};

const handleAutoMarkdown = (editor: Editor, text: string) => {
  const autoPairBrackets = store.getState().autoPairBrackets;
  if (autoPairBrackets && Object.keys(BRACKET_MAP).includes(text)) {
    return handleBrackets(editor, text);
  }
  if (autoPairBrackets && Object.keys(QUOTE_MAP).includes(text)) {
    return handleQuotes(editor, text);
  }
  // Don't handle auto markdown shortcuts in code blocks
  const inCodeBlock = Editor.above(editor, {
    match: n => !Editor.isEditor(n) && Element.isElement(n) && n['type'] === ElementType.CodeBlock,
  });

  if (inCodeBlock) {
    return;
  }

  // Handle shortcuts at the beginning of a line, except in tables
  const inTable = Editor.above(editor, {
    match: n => !Editor.isEditor(n) && Element.isElement(n) && n['type'] === ElementType.Table,
  });
  const blockHandled = !inTable && handleBlockShortcuts(editor, text);
  if (blockHandled) {
    return blockHandled;
  }

  // Handle inline shortcuts
  const inlineHandled = handleInlineShortcuts(editor, text);
  return inlineHandled;
};

export default withAutoMarkdown;
