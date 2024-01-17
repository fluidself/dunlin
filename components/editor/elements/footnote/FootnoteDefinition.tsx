import { useCallback, useMemo, useState, KeyboardEvent, memo, useEffect } from 'react';
import { createEditor, Range, Editor as SlateEditor, Descendant, Transforms, Node, Operation } from 'slate';
import { withReact, Editable, ReactEditor, Slate, useReadOnly } from 'slate-react';
import { withHistory } from 'slate-history';
import { IconX } from '@tabler/icons';
import { isHotkey } from 'is-hotkey';
import { ElementType } from 'types/slate';
import { isElementActive } from 'editor/formatting';
import decorateCodeBlocks from 'editor/decorateCodeBlocks';
import decorateLastActiveSelection from 'editor/decorateLastActiveSelection';
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
import { useStore } from 'lib/store';
import type { AddLinkPopoverState } from 'components/editor/Editor';
import HoveringToolbar from 'components/editor/toolbar/HoveringToolbar';
import AddLinkPopover from 'components/editor/AddLinkPopover';
import EditorElement from 'components/editor/elements/EditorElement';
import withVerticalSpacing from 'components/editor/elements/withVerticalSpacing';
import EditorLeaf from 'components/editor/elements/EditorLeaf';
import DaemonPopover, { type DaemonPopoverState } from 'components/editor/DaemonPopover';
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
  const isDaemonUser = useStore(state => state.isDaemonUser);

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
              withMedia(
                withLinks(
                  withHtml(
                    withBlockBreakout(withVoidElements(withAnnotations(withHistory(withReact(createEditor()))))),
                  ),
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
  const [daemonPopoverState, setDaemonPopoverState] = useState<DaemonPopoverState>({
    isVisible: false,
    selection: undefined,
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
      ...getDefaultEditorHotkeys(
        editor,
        isDaemonUser,
        hasExpandedSelection,
        setDaemonPopoverState,
        setAddLinkPopoverState,
      ),
      {
        hotkey: 'mod+a',
        callback: () => Transforms.select(editor, []),
      },
      {
        hotkey: 'esc',
        callback: () => onClose(),
      },
    ],
    [editor, isDaemonUser, hasExpandedSelection, setAddLinkPopoverState, onClose],
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
      const isAstChange = editor.operations.some((op: Operation) => 'set_selection' !== op.type);
      if (isAstChange) {
        onChange(newValue);
      }
    },
    [editor.selection, editor.operations, onChange],
  );

  if (readOnly) {
    return (
      <div className="pr-1">
        <button className="absolute top-0.5 right-0.5 text-gray-300 hover:text-gray-100" onClick={onClose}>
          <IconX size={14} />
        </button>
        <Slate
          editor={editor}
          initialValue={value}
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
      </div>
    );
  }

  return (
    <div className="pr-1">
      <button className="absolute top-0.5 right-0.5 text-gray-300 hover:text-gray-100" onClick={onClose}>
        <IconX size={14} />
      </button>
      <Slate editor={editor} initialValue={value} onChange={onSlateChange}>
        {isToolbarVisible ? (
          <HoveringToolbar
            setAddLinkPopoverState={setAddLinkPopoverState}
            setDaemonPopoverState={setDaemonPopoverState}
          />
        ) : null}
        {addLinkPopoverState.isVisible ? (
          <AddLinkPopover addLinkPopoverState={addLinkPopoverState} setAddLinkPopoverState={setAddLinkPopoverState} />
        ) : null}
        {daemonPopoverState.isVisible ? (
          <DaemonPopover daemonPopoverState={daemonPopoverState} setDaemonPopoverState={setDaemonPopoverState} />
        ) : null}
        <LinkAutocompletePopover />
        <BlockAutocompletePopover />
        <TagAutocompletePopover />
        <Editable
          className={`overflow-hidden focus-visible:outline-none ${className}`}
          renderElement={renderElement}
          renderLeaf={EditorLeaf}
          placeholder="Enter footnote definition…"
          decorate={entry => {
            const codeSyntaxRanges = decorateCodeBlocks(editor, entry);
            const daemonSelection = decorateLastActiveSelection(editor, entry, daemonPopoverState.selection);
            return [...codeSyntaxRanges, ...daemonSelection];
          }}
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
