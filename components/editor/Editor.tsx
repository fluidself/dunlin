import { useCallback, useMemo, useState, KeyboardEvent, useEffect, memo } from 'react';
import { createEditor, Range, Editor as SlateEditor, Transforms, Descendant, Path } from 'slate';
import { withReact, Editable, ReactEditor, Slate } from 'slate-react';
import { SyncElement, toSharedType, withYjs, withCursor, useCursors } from 'slate-yjs';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { withHistory } from 'slate-history';
import { isHotkey } from 'is-hotkey';
import randomColor from 'randomcolor';
import _pick from 'lodash/pick';
import _isEqual from 'lodash/isEqual';
import { toast } from 'react-toastify';
import colors from 'tailwindcss/colors';
import {
  handleEnter,
  handleIndent,
  handleUnindent,
  isElementActive,
  toggleElement,
  toggleMark,
  handleTableTab,
  TableTabType,
} from 'editor/formatting';
import withAutoMarkdown from 'editor/plugins/withAutoMarkdown';
import withBlockBreakout from 'editor/plugins/withBlockBreakout';
import withBlockReferences from 'editor/plugins/withBlockReferences';
import withImages from 'editor/plugins/withImages';
import withLinks from 'editor/plugins/withLinks';
import withTables from 'editor/plugins/withTables';
import withNormalization from 'editor/plugins/withNormalization';
import withCustomDeleteBackward from 'editor/plugins/withCustomDeleteBackward';
import withVoidElements from 'editor/plugins/withVoidElements';
import withTags from 'editor/plugins/withTags';
import withHtml from 'editor/plugins/withHtml';
import { store, useStore } from 'lib/store';
import { DeckEditor, ElementType, Mark } from 'types/slate';
import useIsMounted from 'utils/useIsMounted';
import { useAuth } from 'utils/useAuth';
import { addEllipsis } from 'utils/string';
import HoveringToolbar from './HoveringToolbar';
import AddLinkPopover from './AddLinkPopover';
import EditorElement from './elements/EditorElement';
import withVerticalSpacing from './elements/withVerticalSpacing';
import withBlockSideMenu from './blockmenu/withBlockSideMenu';
import EditorLeaf from './elements/EditorLeaf';
import { insertTable } from './elements/table/commands';
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

const WEBSOCKET_ENDPOINT =
  process.env.NODE_ENV === 'development' ? 'ws://localhost:1234' : (process.env.NEXT_PUBLIC_Y_WEBSOCKET_ENDPOINT as string);

function Editor(props: Props) {
  const { noteId, onChange, className = '', highlightedPath } = props;
  const isMounted = useIsMounted();
  const { user } = useAuth();

  const note = useStore(state => state.notes[noteId]);
  const value = note?.content;
  const setValue = useCallback((value: Descendant[]) => store.getState().updateNote({ id: noteId, content: value }), [noteId]);

  const color = useMemo(
    () =>
      randomColor({
        luminosity: 'dark',
        format: 'rgba',
        alpha: 1,
      }),
    [],
  );

  const [sharedType, provider] = useMemo(() => {
    const doc = new Y.Doc();
    const sharedType = doc.getArray<SyncElement>('content');
    const provider = new WebsocketProvider(WEBSOCKET_ENDPOINT, noteId, doc, {
      connect: false,
    });

    return [sharedType, provider];
  }, [noteId]);

  const editor = useMemo(() => {
    const editor = withCursor(
      withYjs(
        withNormalization(
          withCustomDeleteBackward(
            withAutoMarkdown(
              withHtml(
                withBlockBreakout(
                  withVoidElements(
                    withTables(
                      withBlockReferences(withImages(withTags(withLinks(withHistory(withReact(createEditor() as DeckEditor)))))),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        sharedType,
      ),
      provider.awareness,
    );

    return editor;
  }, [sharedType, provider]);

  const { decorate } = useCursors(editor);

  useEffect(() => {
    provider.on('sync', (isSynced: boolean) => {
      if (isSynced && sharedType.length === 0) {
        toSharedType(sharedType, value);
      }
    });

    provider.awareness.setLocalState({
      alphaColor: color.slice(0, -2) + '0.2)',
      color,
      name: user ? addEllipsis(user.id) : 'Anonymous',
    });

    provider.connect();

    return () => {
      provider.awareness.destroy();
      provider.disconnect();
    };
    // eslint-disable-next-line
  }, [provider]);

  const renderElement = useMemo(() => {
    const ElementWithSideMenu = withBlockSideMenu(withVerticalSpacing(EditorElement));
    return ElementWithSideMenu;
  }, []);

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
    () => toolbarCanBeVisible && hasExpandedSelection && !addLinkPopoverState.isVisible,
    [toolbarCanBeVisible, hasExpandedSelection, addLinkPopoverState.isVisible],
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
        callback: () => toggleElement(editor, ElementType.CodeBlock),
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
        hotkey: 'mod+shift+h',
        callback: () => insertTable(editor),
      },
      {
        hotkey: 'tab',
        callback: () => {
          isElementActive(editor, ElementType.TableCell) ? handleTableTab(editor, TableTabType.Tab) : handleIndent(editor);
        },
      },
      {
        hotkey: 'shift+tab',
        callback: () => {
          isElementActive(editor, ElementType.TableCell) ? handleTableTab(editor, TableTabType.ShiftTab) : handleUnindent(editor);
        },
      },
      {
        hotkey: 'enter',
        callback: () => handleEnter(editor),
      },
      {
        hotkey: 'shift+enter',
        callback: () => Transforms.insertText(editor, '\n'),
      },
      {
        hotkey: 'mod+enter',
        callback: () => editor.insertBreak(),
      },
    ],
    [editor, setAddLinkPopoverState],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      // Handle keyboard shortcuts
      for (const { hotkey, callback } of hotkeys) {
        if (isHotkey(hotkey, event.nativeEvent)) {
          event.preventDefault();
          callback();
        }
      }
    },
    [hotkeys],
  );

  const onSlateChange = useCallback(
    (newValue: Descendant[]) => {
      if (!note) {
        toast.warn('Someone deleted this note. Please copy your content into a new note if you want to keep it.', {
          toastId: noteId,
        });
        return;
      }
      if (newValue?.length && value?.length) {
        setSelection(editor.selection);
        // We need this check because this function is called every time
        // the selection changes
        const valueNormalized = value.map(v => _pick(v, ['type', 'children']));
        const newValueNormalized = newValue.map(v => _pick(v, ['type', 'children']));
        if (!_isEqual(valueNormalized, newValueNormalized)) {
          setValue(newValue);
          onChange(newValue);
        }
      }
    },
    [editor.selection, onChange, value, setValue, noteId, note],
  );

  // If highlightedPath is defined, highlight the path
  // const darkMode = useStore((state) => state.darkMode);
  const darkMode = true;
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

      domNode.style.backgroundColor = darkMode ? colors.yellow[800] : colors.yellow[200];
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
    <Slate editor={editor} value={value} onChange={onSlateChange}>
      {isToolbarVisible ? <HoveringToolbar setAddLinkPopoverState={setAddLinkPopoverState} /> : null}
      {addLinkPopoverState.isVisible ? (
        <AddLinkPopover addLinkPopoverState={addLinkPopoverState} setAddLinkPopoverState={setAddLinkPopoverState} />
      ) : null}
      <LinkAutocompletePopover />
      <BlockAutocompletePopover />
      <TagAutocompletePopover />
      <Editable
        className={`overflow-hidden placeholder-gray-300 ${className}`}
        renderElement={renderElement}
        renderLeaf={EditorLeaf}
        decorate={decorate}
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
  );
}

export default memo(Editor);
