import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { BaseRange, Editor, Element, Path, Range, Transforms } from 'slate';
import { ReactEditor, useSlateStatic } from 'slate-react';
import {
  IconArrowBackUp,
  IconCheck,
  IconExclamationCircle,
  IconSend,
  IconTextPlus,
  IconTrash,
  type TablerIcon,
} from '@tabler/icons';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import remarkGfm from 'remark-gfm';
import rehypePrism from 'rehype-prism';
import { ReactMarkdown } from 'lib/react-markdown/react-markdown';
import { DaemonMessage } from 'lib/createDaemonSlice';
import { useStore } from 'lib/store';
import { toggleElement } from 'editor/formatting';
import { createNodeId } from 'editor/plugins/withNodeId';
import { stringToSlate } from 'editor/utils';
import { DeckElement, ElementType } from 'types/slate';
import EditorPopover from './EditorPopover';

export type DaemonPopoverState = {
  isVisible: boolean;
  selection?: Range;
};

type Props = {
  daemonPopoverState: DaemonPopoverState;
  setDaemonPopoverState: (state: DaemonPopoverState) => void;
};

export default function DaemonPopover(props: Props) {
  const { daemonPopoverState, setDaemonPopoverState } = props;
  const isDaemonUser = useStore(state => state.isDaemonUser);
  const editor = useSlateStatic();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [summoning, setSummoning] = useState(false);
  const [isError, setIsError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const ctrl = useMemo(() => new AbortController(), []);

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
      textareaRef.current.style.overflow = `${textareaRef.current?.scrollHeight > 200 ? 'auto' : 'hidden'}`;
    }
  }, [input]);

  const hidePopover = useCallback(
    (confirmDiscard = true, locationToSelect?: BaseRange) => {
      if (
        !daemonPopoverState.selection ||
        ((summoning || output) && confirmDiscard && !window.confirm('Do you want to discard the daemon response?'))
      ) {
        return;
      }
      ctrl.abort();
      Transforms.select(editor, locationToSelect ?? daemonPopoverState.selection);
      ReactEditor.focus(editor);
      setDaemonPopoverState({
        isVisible: false,
        selection: undefined,
      });
    },
    [editor, daemonPopoverState, summoning, output, ctrl, setDaemonPopoverState],
  );

  const summonDaemon = async () => {
    if (summoning || !isDaemonUser || !daemonPopoverState.selection || !input) return;
    const selectionText = Editor.string(editor, daemonPopoverState.selection);
    const userMessage: DaemonMessage = { type: 'human', text: selectionText };

    setSummoning(true);
    setIsError(false);
    setInput('');
    setOutput('');

    fetchEventSource('/api/daemon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ editorRequest: input, messages: [userMessage] }),
      signal: ctrl.signal,
      async onopen(response) {
        if (!response.ok) {
          setIsError(true);
          setSummoning(false);
        }
      },
      onmessage(event) {
        const data = JSON.parse(event.data);
        setOutput(prev => prev + data.token);
      },
      onerror() {
        ctrl.abort();
        setIsError(true);
        setSummoning(false);
      },
      onclose() {
        setSummoning(false);
      },
    });
  };

  const setSelectionAndClose = (firstElementId: string, lastElementId: string) => {
    const [startPath] = Array.from(
      Editor.nodes(editor, { at: [], match: n => Element.isElement(n) && n.id === firstElementId }),
    ).map(entry => entry[1]);
    const [endPath] = Array.from(
      Editor.nodes(editor, { at: [], match: n => Element.isElement(n) && n.id === lastElementId }),
    ).map(entry => entry[1]);
    const locationToSelect = { anchor: Editor.start(editor, startPath), focus: Editor.end(editor, endPath) };
    hidePopover(false, locationToSelect);
  };

  const replaceSelection = () => {
    const fragment = stringToSlate(output) as DeckElement[];
    const [firstElementId, lastElementId] = [fragment[0].id, fragment[fragment.length - 1].id];

    Editor.withoutNormalizing(editor, () => {
      if (!daemonPopoverState.selection) return;
      Transforms.select(editor, daemonPopoverState.selection);
      toggleElement(editor, ElementType.Paragraph);
      Transforms.delete(editor);
      Transforms.removeNodes(editor);
      Transforms.insertNodes(editor, fragment);
    });
    setSelectionAndClose(firstElementId, lastElementId);
  };

  const insertBelow = () => {
    if (!daemonPopoverState.selection) return;
    const fragment = stringToSlate(output) as DeckElement[];
    const [firstElementId, lastElementId] = [fragment[0].id, fragment[fragment.length - 1].id];
    const endOfSelection = Editor.end(editor, daemonPopoverState.selection);
    const location = Editor.after(editor, endOfSelection.path, { unit: 'line', voids: true }) ?? Editor.end(editor, []);
    const lastBlockInSelection = Editor.above(editor, { at: endOfSelection, match: n => Editor.isBlock(editor, n) });
    if (!lastBlockInSelection || !Element.isElement(lastBlockInSelection[0])) return;
    const [lastBlockNode] = lastBlockInSelection;

    Editor.withoutNormalizing(editor, () => {
      Transforms.select(editor, endOfSelection);
      if (lastBlockNode.type === ElementType.CodeLine || lastBlockNode.type === ElementType.ListItem) {
        Transforms.insertNodes(
          editor,
          {
            id: createNodeId(),
            type: ElementType.Paragraph,
            children: [{ text: '' }],
          },
          { at: Path.next(Editor.path(editor, location).slice(0, 1)), select: true },
        );
      }
      Transforms.insertNodes(editor, fragment);
    });
    setSelectionAndClose(firstElementId, lastElementId);
  };

  if (!isDaemonUser) return null;

  return (
    <EditorPopover
      selection={daemonPopoverState.selection}
      placement="bottom"
      className="flex flex-col w-160"
      onClose={hidePopover}
    >
      {output ? (
        <>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypePrism]}
            linkTarget="_blank"
            className="p-3 pl-2 prose dark:prose-invert max-w-none overflow-x-auto prose-p:whitespace-pre-line prose-table:border prose-table:border-collapse prose-th:border prose-th:border-gray-700 prose-th:align-baseline prose-th:pt-2 prose-th:pl-2 prose-td:border prose-td:border-gray-700 prose-td:pt-2 prose-td:pl-2 prose-a:text-primary-400 hover:prose-a:underline prose-pre:bg-gray-100 prose-pre:dark:bg-gray-800 prose-pre:text-gray-800 prose-pre:dark:text-gray-100 prose-code:bg-gray-100 prose-code:dark:bg-gray-800 prose-code:text-gray-800 prose-code:dark:text-gray-100"
          >
            {`${output}${summoning ? '`▍`' : ''}`}
          </ReactMarkdown>
          {output && !summoning ? (
            <div className="flex items-center justify-between border-t dark:border-gray-600">
              <ActionButton text="Replace selection" Icon={IconCheck} onClick={replaceSelection} />
              <ActionButton text="Insert below" Icon={IconTextPlus} onClick={insertBelow} />
              <ActionButton text="Try again" Icon={IconArrowBackUp} onClick={() => setOutput('')} />
              <ActionButton text="Discard" Icon={IconTrash} onClick={() => hidePopover(false)} />
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex items-center w-full relative">
          <textarea
            ref={textareaRef}
            className="w-full pl-2 pr-6 py-3 dark:bg-gray-800 shadow-popover dark:text-gray-200 border-gray-50 dark:border-gray-700 focus:ring-0 focus:border-primary-500 resize-none"
            style={{
              maxHeight: '200px',
              overflow: `${textareaRef.current && textareaRef.current.scrollHeight > 200 ? 'auto' : 'hidden'}`,
            }}
            rows={1}
            value={input}
            placeholder="Ask daemon to edit or generate from selection"
            onChange={event => setInput(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey && input) {
                event.preventDefault();
                !summoning && summonDaemon();
              }
            }}
            autoFocus
          />
          <button
            className={`rounded absolute bottom-2.5 right-2 p-1 ${
              !summoning && input
                ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                : 'text-gray-300 dark:text-gray-600 cursor-default'
            }`}
            disabled={summoning || !input}
            onClick={summonDaemon}
          >
            <IconSend size={18} />
          </button>
        </div>
      )}
      {summoning ? (
        <div className="w-full h-1">
          <div className="flex animate-pulse">
            <div className="flex-1">
              <div className="h-1 bg-primary-600 dark:bg-primary-400 rounded-bl-lg rounded-br-lg"></div>
            </div>
          </div>
        </div>
      ) : null}
      {isError ? (
        <div className="flex items-center justify-center py-2 text-sm text-red-500">
          <IconExclamationCircle className="mr-1" size={16} />
          The daemon has failed you. Try again later.
        </div>
      ) : null}
    </EditorPopover>
  );
}

type ActionButtonProps = {
  text: string;
  Icon: TablerIcon;
  onClick: () => void;
};

const ActionButton = (props: ActionButtonProps) => {
  const { text, Icon, onClick } = props;

  return (
    <button
      className="basis-1/4 flex items-center justify-center py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
      onClick={onClick}
    >
      <Icon size={16} className="mr-1" />
      {text}
    </button>
  );
};
