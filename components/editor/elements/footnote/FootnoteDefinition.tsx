import { useCallback, useMemo, useState, KeyboardEvent, memo, useEffect } from 'react';
import { createEditor, Range, Editor as SlateEditor, Descendant, Transforms, Node } from 'slate';
import { withReact, Editable, ReactEditor, Slate, useReadOnly } from 'slate-react';
import { withHistory } from 'slate-history';
import { IconX } from '@tabler/icons';
import { isHotkey } from 'is-hotkey';
import { ElementType } from 'types/slate';
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
import withAnnotations from 'editor/plugins/withAnnotations';
import withHtml from 'editor/plugins/withHtml';
import { getDefaultEditorHotkeys } from 'editor/constants';
import useIsMounted from 'utils/useIsMounted';
import useHotkeys from 'utils/useHotkeys';
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
  onClose: () => void;
};

function FootnoteDefinition(props: Props) {
  const { value, className = '', onChange, onClose } = props;
  const isMounted = useIsMounted();
  const readOnly = useReadOnly();

  const closeHotkey = useMemo(
    () => [
      {
        hotkey: 'esc',
        callback: () => onClose(),
      },
    ],
    [onClose],
  );
  useHotkeys(closeHotkey);

  const editor = useMemo(
    () =>
      withNormalization(
        withCustomDeleteBackward(
          withAutoMarkdown(
            withCodeBlocks(
              withHtml(
                withBlockBreakout(
                  withVoidElements(withMedia(withAnnotations(withLinks(withHistory(withReact(createEditor())))))),
                ),
              ),
            ),
          ),
        ),
      ),
    [],
  );

  useEffect(() => {
    if (value.length === 1 && !Node.string(value[0])) {
      Transforms.select(editor, {
        anchor: SlateEditor.start(editor, []),
        focus: SlateEditor.end(editor, []),
      });
      ReactEditor.focus(editor);
    }
  }, [editor, value]);

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
      {
        hotkey: 'esc',
        callback: () => onClose(),
      },
    ],
    [editor, setAddLinkPopoverState, onClose],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      // Handle keyboard shortcuts
      if (
        isHotkey(['mod+a', 'mod+left', 'mod+shift+left'], event.nativeEvent) &&
        isElementActive(editor, ElementType.CodeBlock)
      ) {
        onCodeBlockKeyDown(event, editor);
      } else {
        for (const { hotkey, callback } of hotkeys) {
          if (isHotkey(hotkey, event.nativeEvent)) {
            event.preventDefault();
            event.stopPropagation();
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
    <div className="pr-1">
      <button className="absolute top-0.5 right-0.5 text-gray-300 hover:text-gray-100" onClick={onClose}>
        <IconX size={14} />
      </button>
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
          placeholder="Enter footnote definition…"
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
    </div>
  );
}

export default memo(FootnoteDefinition);
