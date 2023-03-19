import { useCallback, useRef, useState } from 'react';
import remarkGfm from 'remark-gfm';
import rehypePrism from 'rehype-prism';
import { IconExclamationCircle, IconSearch } from '@tabler/icons';
import ReactMarkdown from 'lib/react-markdown';
import { CommandMenuMode } from './CommandMenu';

type Props = {
  setSelectedMode: (mode: CommandMenuMode) => void;
};

export default function CommandMenuDaemon(props: Props) {
  const { setSelectedMode } = props;
  const [inputText, setInputText] = useState('');
  const [summoning, setSummoning] = useState(false);
  const [isError, setIsError] = useState(false);
  const [output, setOutput] = useState('');
  const growingWrapperRef = useRef<HTMLDivElement | null>(null);

  const summonDaemon = useCallback(async () => {
    if (summoning || !inputText) return;

    setSummoning(true);
    setIsError(false);
    setOutput('');

    const response = await fetch('/api/daemon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: inputText }),
    });
    if (!response.ok) {
      setIsError(true);
      return;
    }

    const data = response.body;
    if (!data) {
      setIsError(true);
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setOutput(prev => prev + chunkValue);
    }

    setSummoning(false);
  }, [inputText, summoning]);

  return (
    <div className="flex flex-col z-30 w-full max-w-screen-sm bg-white rounded shadow-popover dark:bg-gray-800">
      <div className="flex items-center flex-shrink-0 w-full">
        <div className="w-9 h-full relative">
          <IconSearch className="absolute top-4 left-4 text-gray-500" size={20} />
        </div>
        <div className="w-full h-full grid text-lg grow-wrap" ref={growingWrapperRef}>
          <textarea
            className="px-2 py-3 text-lg bg-gray-800 border-none text-gray-200 focus:ring-0 resize-none overflow-hidden row-start-1 row-end-2 col-start-1 col-end-2"
            placeholder="Ask a question"
            rows={1}
            value={inputText}
            onChange={event => {
              setInputText(event.target.value);
              if (!growingWrapperRef.current) return;
              growingWrapperRef.current.dataset.replicatedValue = event.target.value;
            }}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                !summoning && summonDaemon();
              }
            }}
            autoFocus
          ></textarea>
        </div>
      </div>
      <div className="flex items-center text-sm text-gray-300 space-x-6 pt-1 pb-3 px-4">
        <button
          className="border border-gray-700 rounded px-2 py-1 bg-transparent text-gray-300"
          onClick={() => setSelectedMode(CommandMenuMode.SEARCH)}
        >
          Notes & elements
        </button>
        <button className="border border-gray-700 rounded px-2 py-1 bg-white text-gray-900">Daemon</button>
      </div>
      {summoning && !output ? (
        <div className="w-full">
          <div className="flex animate-pulse">
            <div className="flex-1">
              <div className="h-1 bg-primary-400 rounded-bl rounded-br"></div>
            </div>
          </div>
        </div>
      ) : null}
      {isError ? (
        <div className="flex items-center justify-center py-2 text-red-500 rounded-bl rounded-br">
          <IconExclamationCircle className="mr-1" size={20} />
          The daemon has failed you. Try again later.
        </div>
      ) : null}
      {output ? (
        <div className="flex-1 w-full overflow-y-auto bg-white border-t rounded-bl rounded-br dark:bg-gray-800 dark:border-gray-700">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypePrism]}
            linkTarget="_blank"
            className="prose prose-invert max-w-none px-4 py-2 prose-table:border prose-table:border-collapse prose-th:border prose-th:border-gray-700 prose-th:align-baseline prose-th:pt-2 prose-th:pl-2 prose-td:border prose-td:border-gray-700 prose-td:pt-2 prose-td:pl-2 prose-a:text-primary-500 hover:prose-a:underline"
          >
            {output}
          </ReactMarkdown>
        </div>
      ) : null}
    </div>
  );
}
