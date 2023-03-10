import { useCallback, useMemo, useState, KeyboardEvent, memo, useEffect } from 'react';
import { createEditor, Range, Editor as SlateEditor, Descendant, Transforms } from 'slate';
import { withReact, Editable, ReactEditor, Slate, useReadOnly } from 'slate-react';
import { SyncElement, toSharedType, withYjs, withCursor, useCursors } from 'slate-yjs';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { withHistory } from 'slate-history';
import { isHotkey } from 'is-hotkey';
import randomColor from 'randomcolor';
import _pick from 'lodash/pick';
import _isEqual from 'lodash/isEqual';
import { toast } from 'react-toastify';
import { ElementType } from 'types/slate';
import useIsMounted from 'utils/useIsMounted';
import { useAuth } from 'utils/useAuth';
import { useCurrentNote } from 'utils/useCurrentNote';
import { addEllipsis } from 'utils/string';
import { useStore } from 'lib/store';
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
import withTables, { onKeyDown as onTableKeyDown } from 'editor/plugins/withTables';
import { getDefaultEditorHotkeys } from 'editor/constants';
import type { AddLinkPopoverState } from 'components/editor/Editor';
import Portal from 'components/Portal';
import CommandMenu, { type CommandMenuState } from 'components/CommandMenu';
import HoveringToolbar from 'components/editor/toolbar/HoveringToolbar';
import AddLinkPopover from 'components/editor/AddLinkPopover';
import EditorElement from 'components/editor/elements/EditorElement';
import withVerticalSpacing from 'components/editor/elements/withVerticalSpacing';
import EditorLeaf from 'components/editor/elements/EditorLeaf';
import LinkAutocompletePopover from 'components/editor/LinkAutocompletePopover';
import BlockAutocompletePopover from 'components/editor/BlockAutocompletePopover';
import TagAutocompletePopover from 'components/editor/TagAutocompletePopover';

type Props = {
  elementId: string;
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
  className?: string;
};

function CalloutContent(props: Props) {
  const { elementId, value, className = '', onChange } = props;
  const isMounted = useIsMounted();
  const readOnly = useReadOnly();
  const { user } = useAuth();
  const { id: noteId } = useCurrentNote();
  const note = useStore(state => state.notes[noteId]);

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
    const provider = new WebsocketProvider(process.env.WEBSOCKET_ENDPOINT as string, elementId, doc, {
      connect: false,
    });

    return [sharedType, provider];
  }, [elementId]);

  const editor = useMemo(() => {
    const editor = withCursor(
      withYjs(
        withNormalization(
          withCustomDeleteBackward(
            withAutoMarkdown(
              withCodeBlocks(
                withHtml(
                  withBlockBreakout(
                    withVoidElements(
                      withMedia(withAnnotations(withLinks(withTables(withHistory(withReact(createEditor())))))),
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

  const renderElement = useMemo(() => withVerticalSpacing(EditorElement), []);

  const [commandMenuState, setCommandMenuState] = useState<CommandMenuState>({
    isVisible: false,
    editor: undefined,
  });
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
      !commandMenuState.isVisible &&
      !isElementActive(editor, ElementType.CodeLine),
    [toolbarCanBeVisible, hasExpandedSelection, editor, addLinkPopoverState.isVisible, commandMenuState.isVisible],
  );

  const hotkeys = useMemo(
    () => [
      ...getDefaultEditorHotkeys(editor, setAddLinkPopoverState, setCommandMenuState),
      {
        hotkey: 'mod+a',
        callback: () => Transforms.select(editor, []),
      },
    ],
    [editor, setCommandMenuState, setAddLinkPopoverState],
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
      if (!note) {
        toast.warn('Someone deleted this note. Please copy your content into a new note if you want to keep it.', {
          toastId: noteId,
        });
        return;
      }
      if (newValue?.length && value?.length) {
        setSelection(editor.selection);
        const valueNormalized = value.map(v => _pick(v, ['type', 'children']));
        const newValueNormalized = newValue.map(v => _pick(v, ['type', 'children']));
        if (!_isEqual(valueNormalized, newValueNormalized)) {
          onChange(newValue);
        }
      }
    },
    [editor.selection, onChange, value, noteId, note],
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
          decorate={entry => {
            const codeSyntaxRanges = decorateCodeBlocks(editor, entry);
            const cursorRanges = decorate(entry);
            return [...codeSyntaxRanges, ...cursorRanges];
          }}
          readOnly
        />
      </Slate>
    );
  }

  return (
    <>
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
          decorate={entry => {
            const codeSyntaxRanges = decorateCodeBlocks(editor, entry);
            const cursorRanges = decorate(entry);
            return [...codeSyntaxRanges, ...cursorRanges];
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
      {commandMenuState.isVisible ? (
        <Portal>
          <CommandMenu commandMenuState={commandMenuState} setCommandMenuState={setCommandMenuState} />
        </Portal>
      ) : null}
    </>
  );
}

export default memo(CalloutContent);