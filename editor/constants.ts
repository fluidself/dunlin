import { SetStateAction } from 'react';
import { Descendant, Editor, Transforms } from 'slate';
import { ElementType, Mark } from 'types/slate';
import type { AddLinkPopoverState } from 'components/editor/Editor';
import type { CommandMenuState } from 'components/CommandMenu';
import {
  handleBrackets,
  handleExitBreak,
  handleIndent,
  handleQuotes,
  handleUnindent,
  insertFootnote,
  isElementActive,
  toggleElement,
  toggleMark,
} from './formatting';
import { insertTable } from './plugins/withTables';
import { createNodeId } from './plugins/withNodeId';

export const getDefaultEditorValue = (): Descendant[] => [
  { id: createNodeId(), type: ElementType.Paragraph, children: [{ text: '' }] },
];

export const getDefaultEditorHotkeys = (
  editor: Editor,
  setAddLinkPopoverState: (value: SetStateAction<AddLinkPopoverState>) => void,
  setCommandMenuState?: (value: SetStateAction<CommandMenuState>) => void,
) => [
  {
    hotkey: 'esc',
    callback: () => Transforms.collapse(editor, { edge: 'start' }),
  },
  {
    hotkey: 'mod+b',
    callback: () => toggleMark(editor, Mark.Bold),
  },
  {
    hotkey: 'mod+i',
    callback: () => toggleMark(editor, Mark.Italic),
  },
  {
    hotkey: 'mod+u',
    callback: () => toggleMark(editor, Mark.Underline),
  },
  {
    hotkey: 'mod+e',
    callback: () => toggleMark(editor, Mark.Code),
  },
  {
    hotkey: 'mod+shift+s',
    callback: () => toggleMark(editor, Mark.Strikethrough),
  },
  {
    hotkey: 'mod+shift+h',
    callback: () => toggleMark(editor, Mark.Highlight),
  },
  {
    hotkey: 'mod+shift+,',
    callback: () => toggleMark(editor, Mark.Superscript, Mark.Subscript),
  },
  {
    hotkey: 'mod+shift+.',
    callback: () => toggleMark(editor, Mark.Subscript, Mark.Superscript),
  },
  {
    hotkey: 'mod+shift+1',
    callback: () => toggleElement(editor, ElementType.HeadingOne),
  },
  {
    hotkey: 'mod+shift+2',
    callback: () => toggleElement(editor, ElementType.HeadingTwo),
  },
  {
    hotkey: 'mod+shift+3',
    callback: () => toggleElement(editor, ElementType.HeadingThree),
  },
  {
    hotkey: 'mod+shift+4',
    callback: () => toggleElement(editor, ElementType.BulletedList),
  },
  {
    hotkey: 'mod+shift+5',
    callback: () => toggleElement(editor, ElementType.NumberedList),
  },
  {
    hotkey: 'mod+shift+6',
    callback: () => toggleElement(editor, ElementType.CheckListItem),
  },
  {
    hotkey: 'mod+shift+7',
    callback: () => toggleElement(editor, ElementType.Blockquote),
  },
  {
    hotkey: 'mod+shift+8',
    callback: () => toggleElement(editor, ElementType.CodeLine),
  },
  {
    hotkey: 'mod+shift+9',
    callback: () => toggleElement(editor, ElementType.Paragraph),
  },
  {
    hotkey: 'mod+k',
    callback: () => {
      if (editor.selection) {
        // Save the selection and make the add link popover visible
        setAddLinkPopoverState({
          isVisible: true,
          selection: editor.selection,
          isLink: isElementActive(editor, ElementType.ExternalLink) || isElementActive(editor, ElementType.NoteLink),
        });
      }
    },
  },
  {
    hotkey: 'mod+opt+f',
    callback: () => insertFootnote(editor),
  },
  {
    hotkey: 'mod+shift+k',
    callback: () => insertTable(editor),
  },
  {
    hotkey: 'tab',
    callback: () => handleIndent(editor),
  },
  {
    hotkey: 'shift+tab',
    callback: () => handleUnindent(editor),
  },
  {
    hotkey: 'shift+enter',
    callback: () => Transforms.insertText(editor, '\n'),
  },
  {
    hotkey: 'mod+enter',
    callback: () => handleExitBreak(editor),
  },
  {
    hotkey: 'shift+9',
    callback: () => handleBrackets(editor, '('),
  },
  {
    hotkey: '[',
    callback: () => handleBrackets(editor, '['),
  },
  {
    hotkey: 'shift+[',
    callback: () => handleBrackets(editor, '{'),
  },
  {
    hotkey: "'",
    callback: () => handleQuotes(editor, "'"),
  },
  {
    hotkey: "shift+'",
    callback: () => handleQuotes(editor, '"'),
  },
  ...(setCommandMenuState
    ? [
        {
          hotkey: 'mod+p',
          callback: () => setCommandMenuState({ isVisible: true, editor }),
        },
      ]
    : []),
];
