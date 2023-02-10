import { useCallback, useMemo, useState, KeyboardEvent, useRef, memo } from 'react';
import { createEditor, Range, Editor as SlateEditor, Descendant, Transforms } from 'slate';
import { withReact, Editable, ReactEditor, Slate, useReadOnly } from 'slate-react';
import { withHistory } from 'slate-history';
import { isHotkey } from 'is-hotkey';
import { ElementType } from 'types/slate';
import useIsMounted from 'utils/useIsMounted';
import { isElementActive } from 'editor/formatting';
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
import withTables, { onKeyDown as onTableKeyDown } from 'editor/plugins/withTables';
import { getDefaultEditorHotkeys } from 'editor/constants';
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
      ...getDefaultEditorHotkeys(editor, setAddLinkPopoverState),
      {
        hotkey: 'mod+a',
        callback: () => Transforms.select(editor, []),
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
