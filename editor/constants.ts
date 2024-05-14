import { SetStateAction } from 'react';
import { Descendant, Editor, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import { ElementType, ExternalLink, Mark, NoteLink } from 'types/slate';
import type { AddLinkPopoverState } from 'components/editor/Editor';
import type { DaemonPopoverState } from 'components/editor/DaemonPopover';
import { store } from 'lib/store';
import {
  handleExitBreak,
  handleIndent,
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
  isDaemonUser: boolean,
  hasExpandedSelection: boolean,
  setDaemonPopoverState: (value: SetStateAction<DaemonPopoverState>) => void,
  setAddLinkPopoverState: (value: SetStateAction<AddLinkPopoverState>) => void,
  activeEditor?: string,
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
    hotkey: 'mod+p',
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
    hotkey: 'opt+enter',
    callback: () => {
      const linkNodeEntry = Editor.above<ExternalLink | NoteLink>(editor, {
        match: n => n.type === ElementType.ExternalLink || n.type === ElementType.NoteLink,
      });

      if (linkNodeEntry) {
        const [link] = linkNodeEntry;
        const domNode = ReactEditor.toDOMNode(editor, link);
        domNode.click();
      }
    },
  },
  ...(isDaemonUser
    ? [
        {
          hotkey: 'mod+j',
          callback: () => {
            if (hasExpandedSelection) {
              setDaemonPopoverState({
                isVisible: true,
                selection: editor.selection,
              });
            }
          },
        },
      ]
    : []),
  ...(activeEditor
    ? [
        {
          hotkey: 'mod+k',
          callback: () => store.getState().setCommandMenuState({ isVisible: true, activeEditor }),
        },
      ]
    : []),
];
