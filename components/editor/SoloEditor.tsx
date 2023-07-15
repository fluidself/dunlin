import { useCallback, useMemo, useState, KeyboardEvent, useEffect, useRef, memo } from 'react';
import { createEditor, Range, Editor as SlateEditor, Descendant, Path } from 'slate';
import { withReact, Editable, ReactEditor, Slate } from 'slate-react';
import { withHistory } from 'slate-history';
import { isHotkey } from 'is-hotkey';
import colors from 'tailwindcss/colors';
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
import withBlockReferences from 'editor/plugins/withBlockReferences';
import withCodeBlocks, { onKeyDown as onCodeBlockKeyDown } from 'editor/plugins/withCodeBlocks';
import withAnnotations from 'editor/plugins/withAnnotations';
import withHtml from 'editor/plugins/withHtml';
import withTables, { onKeyDown as onTableKeyDown } from 'editor/plugins/withTables';
import { getDefaultEditorHotkeys, getDefaultEditorValue } from 'editor/constants';
import { store, useStore } from 'lib/store';
import activeEditorsStore from 'lib/activeEditorsStore';
import { ElementType } from 'types/slate';
import useIsMounted from 'utils/useIsMounted';
import HoveringToolbar from './toolbar/HoveringToolbar';
import AddLinkPopover from './AddLinkPopover';
import EditorElement from './elements/EditorElement';
import withVerticalSpacing from './elements/withVerticalSpacing';
import withBlockSideMenu from './blockmenu/withBlockSideMenu';
import EditorLeaf from './elements/EditorLeaf';
import DaemonPopover, { type DaemonPopoverState } from './DaemonPopover';
import LinkAutocompletePopover from './LinkAutocompletePopover';
import BlockAutocompletePopover from './BlockAutocompletePopover';
import TagAutocompletePopover from './TagAutocompletePopover';

export type AddLinkPopoverState = {
  isVisible: boolean;
  selection?: Range;
  isLink?: boolean;
};

type Props = {
  noteId: string;
  onChange: (value: Descendant[]) => void;
  className?: string;
  highlightedPath?: Path;
};

function SoloEditor(props: Props) {
  const { noteId, onChange, className = '', highlightedPath } = props;
  const isMounted = useIsMounted();
  const commandMenuState = useStore(state => state.commandMenuState);
  const isDaemonUser = useStore(state => state.isDaemonUser);

  const value = useStore(state => state.notes[noteId]?.content ?? getDefaultEditorValue());
  const setValue = useCallback(
    (value: Descendant[]) => store.getState().updateNote({ id: noteId, content: value }),
    [noteId],
  );

  const editorRef = useRef<SlateEditor>();
  if (!editorRef.current) {
    editorRef.current = withNormalization(
      withCustomDeleteBackward(
        withAutoMarkdown(
          withCodeBlocks(
            withLinks(
              withHtml(
                withBlockBreakout(
                  withVoidElements(
                    withBlockReferences(withMedia(withAnnotations(withTables(withHistory(withReact(createEditor())))))),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
  const editor = editorRef.current;

  useEffect(() => {
    activeEditorsStore.addActiveEditor(noteId, editor);
    return () => activeEditorsStore.removeActiveEditor(noteId);
  }, [noteId, editor]);

  const renderElement = useMemo(() => {
    const ElementWithSideMenu = withBlockSideMenu(withVerticalSpacing(EditorElement));
    return ElementWithSideMenu;
  }, []);

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
      !daemonPopoverState.isVisible &&
      !commandMenuState.isVisible &&
      !isElementActive(editor, ElementType.CodeLine),
    [
      toolbarCanBeVisible,
      hasExpandedSelection,
      editor,
      addLinkPopoverState.isVisible,
      daemonPopoverState.isVisible,
      commandMenuState.isVisible,
    ],
  );

  const isFocused = ReactEditor.isFocused(editor);
  useEffect(() => {
    if (isFocused) store.getState().setActiveNoteId(noteId);
  }, [isFocused, noteId]);

  const hotkeys = useMemo(
    () =>
      getDefaultEditorHotkeys(
        editor,
        isDaemonUser,
        hasExpandedSelection,
        setDaemonPopoverState,
        setAddLinkPopoverState,
        noteId,
      ),
    [editor, noteId, isDaemonUser, hasExpandedSelection, setAddLinkPopoverState, setDaemonPopoverState],
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
      // We need this check because this function is called every time
      // the selection changes
      if (newValue !== value) {
        setValue(newValue);
        onChange(newValue);
      }
    },
    [editor.selection, onChange, value, setValue],
  );

  // If highlightedPath is defined, highlight the path
  const darkMode = useStore(state => state.darkMode);
  useEffect(() => {
    if (!highlightedPath) {
      return;
    }

    try {
      // Scroll to line
      const [node] = SlateEditor.node(editor, highlightedPath);
      const domNode = ReactEditor.toDOMNode(editor, node);
      domNode.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      // Highlight line, but restore original color if mouse is clicked or component is re-rendered
      const originalBgColor = domNode.style.backgroundColor;
      const removeHighlight = () => {
        domNode.style.backgroundColor = originalBgColor;
      };

      domNode.style.backgroundColor = darkMode ? '#828324' : colors.yellow[200];
      domNode.addEventListener('click', removeHighlight, { once: true });

      return () => {
        removeHighlight();
        document.removeEventListener('click', removeHighlight);
      };
    } catch (e) {
      // Do nothing if an error occurs, which sometimes happens if the router changes before the editor does
    }
  }, [editor, highlightedPath, darkMode]);

  return (
    <>
      <Slate editor={editor} value={value} onChange={onSlateChange}>
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
          className={`overflow-hidden placeholder-gray-300 focus-visible:outline-none ${className}`}
          renderElement={renderElement}
          renderLeaf={EditorLeaf}
          decorate={entry => {
            const codeSyntaxRanges = decorateCodeBlocks(editor, entry);
            const daemonSelection = decorateLastActiveSelection(editor, entry, daemonPopoverState.selection);
            return [...codeSyntaxRanges, ...daemonSelection];
          }}
          placeholder="Start typing here…"
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
    </>
  );
}

export default memo(SoloEditor);
