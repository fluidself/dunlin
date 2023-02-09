import { useCallback, useMemo, useState, KeyboardEvent, useRef, memo } from 'react';
import { createEditor, Range, Editor as SlateEditor, Transforms, Descendant } from 'slate';
import { withReact, Editable, ReactEditor, Slate, useReadOnly } from 'slate-react';
import { withHistory } from 'slate-history';
import { isHotkey } from 'is-hotkey';
import { ElementType, Mark } from 'types/slate';
import useIsMounted from 'utils/useIsMounted';
import {
  handleBrackets,
  handleExitBreak,
  handleIndent,
  handleQuotes,
  handleUnindent,
  isElementActive,
  toggleElement,
  toggleMark,
} from 'editor/formatting';
import decorateCodeBlocks from 'editor/decorateCodeBlocks';
import withAutoMarkdown from 'editor/plugins/withAutoMarkdown';
import withBlockBreakout from 'editor/plugins/withBlockBreakout';
import withMedia from 'editor/plugins/withMedia';
import withLinks from 'editor/plugins/withLinks';
import withNormalization from 'editor/plugins/withNormalization';
import withCustomDeleteBackward from 'editor/plugins/withCustomDeleteBackward';
import withVoidElements from 'editor/plugins/withVoidElements';
import withCodeBlocks, { onKeyDown as onCodeBlockKeyDown } from 'editor/plugins/withCodeBlocks';
import withTags from 'editor/plugins/withTags';
import withHtml from 'editor/plugins/withHtml';
import withTables, { insertTable, onKeyDown as onTableKeyDown } from 'editor/plugins/withTables';
import type { AddLinkPopoverState } from 'components/editor/Editor';
import HoveringToolbar from 'components/editor/toolbar/HoveringToolbar';
import AddLinkPopover from 'components/editor/AddLinkPopover';
import EditorElement from 'components/editor/elements/EditorElement';
import withVerticalSpacing from 'components/editor/elements/withVerticalSpacing';
import EditorLeaf from 'components/editor/elements/EditorLeaf';
import LinkAutocompletePopover from 'components/editor/LinkAutocompletePopover';
import BlockAutocompletePopover from 'components/editor/BlockAutocompletePopover';
import TagAutocompletePopover from 'components/editor/TagAutocompletePopover';

type Props = {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
  className?: string;
};

function CalloutContent(props: Props) {
  const { value, className = '', onChange } = props;
  const isMounted = useIsMounted();
  const readOnly = useReadOnly();

  const editorRef = useRef<SlateEditor>();
  if (!editorRef.current) {
    editorRef.current = withNormalization(
      withCustomDeleteBackward(
        withAutoMarkdown(
          withCodeBlocks(
            withHtml(
              withBlockBreakout(
                withVoidElements(withMedia(withTags(withLinks(withTables(withHistory(withReact(createEditor()))))))),
              ),
            ),
          ),
        ),
      ),
    );
  }
  const editor = editorRef.current;

  const renderElement = useMemo(() => withVerticalSpacing(EditorElement), []);

  const [addLinkPopoverState, setAddLinkPopoverState] = useState<AddLinkPopoverState>({
    isVisible: false,
    selection: undefined,
    isLink: false,
  });

  const [selection, setSelection] = useState(editor.selection);
  const [toolbarCanBeVisible, setToolbarCanBeVisible] = useState(true);
  const hasExpandedSelection = useMemo(
    () =>
      !!selection &&
      ReactEditor.isFocused(editor) &&
      !Range.isCollapsed(selection) &&
      SlateEditor.string(editor, selection, { voids: true }) !== '',
    [editor, selection],
  );
  const isToolbarVisible = useMemo(
    () =>
      toolbarCanBeVisible &&
      hasExpandedSelection &&
      !addLinkPopoverState.isVisible &&
      !isElementActive(editor, ElementType.CodeLine),
    [toolbarCanBeVisible, hasExpandedSelection, editor, addLinkPopoverState.isVisible],
  );

  const hotkeys = useMemo(
    () => [
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
              isLink:
                isElementActive(editor, ElementType.ExternalLink) || isElementActive(editor, ElementType.NoteLink),
            });
          }
        },
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
    ],
    [editor, setAddLinkPopoverState],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      // Handle keyboard shortcuts
      if (
        isHotkey(['up', 'down', 'tab', 'shift+tab', 'enter'], event.nativeEvent) &&
        isElementActive(editor, ElementType.Table)
      ) {
        onTableKeyDown(event, editor);
      } else if (
        isHotkey(['mod+a', 'mod+left', 'mod+shift+left'], event.nativeEvent) &&
        isElementActive(editor, ElementType.CodeBlock)
      ) {
        onCodeBlockKeyDown(event, editor);
      } else {
        for (const { hotkey, callback } of hotkeys) {
          if (isHotkey(hotkey, event.nativeEvent)) {
            event.preventDefault();
            callback();
          }
        }
      }
    },
    [hotkeys, editor],
  );

  const onSlateChange = useCallback(
    (newValue: Descendant[]) => {
      setSelection(editor.selection);
      if (newValue !== value) {
        onChange(newValue);
      }
    },
    [editor.selection, value, onChange],
  );

  if (readOnly) {
    return (
      <Slate
        editor={editor}
        value={value}
        onChange={() => {
          /* Do nothing, this is a read only editor */
        }}
      >
        <Editable
          className={`overflow-hidden focus-visible:outline-none ${className}`}
          renderElement={renderElement}
          renderLeaf={EditorLeaf}
          decorate={entry => decorateCodeBlocks(editor, entry)}
          readOnly
        />
      </Slate>
    );
  }

  return (
    <Slate editor={editor} value={value} onChange={onSlateChange}>
      {isToolbarVisible ? <HoveringToolbar setAddLinkPopoverState={setAddLinkPopoverState} /> : null}
      {addLinkPopoverState.isVisible ? (
        <AddLinkPopover addLinkPopoverState={addLinkPopoverState} setAddLinkPopoverState={setAddLinkPopoverState} />
      ) : null}
      <LinkAutocompletePopover />
      <BlockAutocompletePopover />
      <TagAutocompletePopover />
      <Editable
        className={`overflow-hidden focus-visible:outline-none ${className}`}
        renderElement={renderElement}
        renderLeaf={EditorLeaf}
        decorate={entry => decorateCodeBlocks(editor, entry)}
        onKeyDown={onKeyDown}
        onPointerDown={() => setToolbarCanBeVisible(false)}
        onPointerUp={() =>
          setTimeout(() => {
            if (isMounted()) setToolbarCanBeVisible(true);
          }, 100)
        }
        spellCheck
      />
    </Slate>
  );
}

export default memo(CalloutContent);
