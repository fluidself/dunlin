import Head from 'next/head';
import { withIronSessionSsr } from 'iron-session/next';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import {
  IconArrowDown,
  IconCheck,
  IconCopy,
  IconDownload,
  IconExclamationCircle,
  IconGhost2,
  IconRefresh,
  IconSend,
  IconX,
} from '@tabler/icons';
import classNames from 'classnames';
import type { Descendant } from 'slate';
import { toast } from 'react-toastify';
import rehypePrism from 'rehype-prism';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import wikiLinkPlugin from 'remark-wiki-link';
import remarkSupersub from 'lib/remark-supersub';
import ReactMarkdown from 'lib/react-markdown';
import upsertNote from 'lib/api/upsertNote';
import { useStore } from 'lib/store';
import remarkToSlate from 'editor/serialization/remarkToSlate';
import { ironOptions } from 'constants/iron-session';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { useAuth } from 'utils/useAuth';
import copyToClipboard from 'utils/copyToClipboard';
import type { ChatCompletionMessage } from 'utils/openai-stream';
import ErrorBoundary from 'components/ErrorBoundary';
import OpenSidebarButton from 'components/sidebar/OpenSidebarButton';
import Identicon from 'components/Identicon';

export default function Daemon() {
  const router = useRouter();
  const { user } = useAuth();
  const { id: deckId } = useCurrentDeck();
  const isSidebarOpen = useStore(state => state.isSidebarOpen);
  const authorOnlyNotes = useStore(state => state.authorOnlyNotes);
  const messages = useStore(state => state.daemonMessages);
  const setMessages = useStore(state => state.setDaemonMessages);
  const [inputText, setInputText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [summoning, setSummoning] = useState(false);
  const [isError, setIsError] = useState(false);
  const [saving, setIsSaving] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(0);
  const daemonContainerRef = useRef<HTMLDivElement | null>(null);
  const growingWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (daemonContainerRef.current) {
      daemonContainerRef.current.scrollTo({
        top: daemonContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const summonDaemon = async () => {
    if (summoning || !inputText) return;
    const userMessage: ChatCompletionMessage = { role: 'user', content: inputText };

    setSummoning(true);
    setIsError(false);
    setMessages(prevMessages => [...prevMessages, userMessage]);
    updateInputText('');

    const response = await fetch('/api/daemon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageLog: [...messages, userMessage] }),
    });
    const data = response.body;
    if (!response.ok || !data) {
      setIsError(true);
      setSummoning(false);
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: '' }]);

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setMessages(prevMessages => {
        const lastMsg = prevMessages[prevMessages.length - 1];
        const newMessages = [...prevMessages.slice(0, -1), { ...lastMsg, content: lastMsg.content + chunkValue }];
        return newMessages;
      });
    }

    setSummoning(false);
  };

  const saveAsNote = async () => {
    if (!user?.id || !noteTitle) return;

    const parsedMessages = messages
      .map(message => `**${message.role === 'user' ? 'User' : 'Daemon'}**:\n${message.content}\n\n---\n\n`)
      .join('');
    const { result } = unified()
      .use(remarkParse)
      .use(remarkSupersub)
      .use(remarkGfm)
      .use(wikiLinkPlugin, { aliasDivider: '|' })
      .use(remarkToSlate)
      .processSync(parsedMessages);
    const newNote = {
      deck_id: deckId,
      user_id: user.id,
      author_only: authorOnlyNotes,
      title: noteTitle,
      content: result as Descendant[],
    };
    const note = await upsertNote(newNote);

    if (!note) {
      toast.error(`There was an error creating the note ${noteTitle}.`);
      return;
    }

    router.push(`/app/${deckId}/note/${note.id}`);
  };

  const updateInputText = (text: string) => {
    setInputText(text);
    if (!growingWrapperRef.current) return;
    growingWrapperRef.current.dataset.replicatedValue = text;
  };

  return (
    <>
      <Head>
        <title>Daemon | Dunlin</title>
      </Head>
      <ErrorBoundary>
        {!isSidebarOpen ? <OpenSidebarButton className="absolute top-0 left-0 z-10 mx-4 my-1" /> : null}
        <div
          className="w-full h-full overflow-y-auto px-8 pt-8 md:pt-12 md:px-12"
          ref={daemonContainerRef}
          onScroll={() => {
            if (daemonContainerRef.current) setScrollHeight(daemonContainerRef.current.scrollTop);
          }}
        >
          <div className="flex flex-col w-full h-full mx-auto md:w-128 lg:w-160 xl:w-192">
            <div className="flex-1">
              {messages.map((message, idx) => (
                <Message key={idx} message={message} />
              ))}
            </div>
            <div className="sticky bottom-0 flex flex-col items-center space-y-2 pt-3 pb-12 md:w-128 lg:w-160 xl:w-192 bg-white dark:bg-gray-900">
              {messages.length && !summoning && !saving ? (
                <div className="flex items-center space-x-2">
                  <button
                    className="flex items-center justify-center px-2 py-1 text-sm bg-transparent rounded border border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    disabled={summoning}
                    onClick={() => setMessages([])}
                  >
                    <IconRefresh size={16} className="mr-1" />
                    Reset daemon
                  </button>
                  <button
                    className="flex items-center justify-center px-2 py-1 text-sm bg-transparent rounded border border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    disabled={summoning}
                    onClick={() => setIsSaving(true)}
                  >
                    <IconDownload size={16} className="mr-1" />
                    Save as note
                  </button>
                </div>
              ) : null}
              {messages.length && !summoning && saving ? (
                <div className="w-1/3 flex items-center space-x-1">
                  <input
                    type="text"
                    className="input text-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                    placeholder="Enter note name"
                    value={noteTitle}
                    onChange={event => setNoteTitle(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Escape') {
                        setIsSaving(false);
                      } else if (event.key === 'Enter' && noteTitle) {
                        event.preventDefault();
                        saveAsNote();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    className={`text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 ${
                      !noteTitle ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    disabled={!noteTitle}
                    onClick={saveAsNote}
                  >
                    <IconCheck size={20} />
                  </button>
                  <button
                    className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
                    onClick={() => setIsSaving(false)}
                  >
                    <IconX size={20} />
                  </button>
                </div>
              ) : null}
              <div className="flex items-center w-full relative">
                <div className="w-full h-full grid text-lg grow-wrap" ref={growingWrapperRef}>
                  <textarea
                    className={`pl-2 pr-6 py-3 text-lg dark:bg-gray-800 shadow-popover border dark:text-gray-200 border-gray-50 dark:border-gray-700 focus:ring-0 resize-none overflow-hidden row-start-1 row-end-2 col-start-1 col-end-2 ${
                      summoning ? 'rounded-tl rounded-tr' : 'rounded'
                    }`}
                    placeholder="Send a message..."
                    rows={1}
                    value={inputText}
                    onChange={event => updateInputText(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' && !event.shiftKey && inputText) {
                        event.preventDefault();
                        !summoning && summonDaemon();
                      }
                    }}
                    autoFocus
                  ></textarea>
                </div>
                <button
                  className={`rounded absolute bottom-3.5 right-2 p-1 ${
                    !summoning && inputText
                      ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                      : 'text-gray-300 dark:text-gray-600 cursor-default'
                  }`}
                  disabled={summoning || !inputText}
                  onClick={summonDaemon}
                >
                  <IconSend size={20} />
                </button>
              </div>
              <div className="w-full h-1">
                {summoning ? (
                  <div className="flex animate-pulse">
                    <div className="flex-1">
                      <div className="h-1 bg-primary-600 dark:bg-primary-400 rounded-bl-lg rounded-br-lg"></div>
                    </div>
                  </div>
                ) : null}
              </div>
              {isError ? (
                <div className="flex items-center pt-2 text-red-500">
                  <IconExclamationCircle className="mr-1" size={20} />
                  The daemon has failed you. Try again later.
                </div>
              ) : null}
            </div>
          </div>
          {daemonContainerRef.current &&
          scrollHeight + daemonContainerRef.current.clientHeight * 1.05 < daemonContainerRef.current.scrollHeight ? (
            <button
              className="absolute right-6 md:bottom-[110px] p-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              onClick={scrollToBottom}
            >
              <IconArrowDown size={20} className="text-gray-500 dark:text-gray-300" />
            </button>
          ) : null}
        </div>
      </ErrorBoundary>
    </>
  );
}

type MessageProps = {
  message: ChatCompletionMessage;
};

const Message = (props: MessageProps) => {
  const { role, content } = props.message;
  const messageClassName = classNames(
    'flex w-full space-x-2 py-4 pl-2 dark:text-gray-200',
    { 'bg-gray-100 dark:bg-gray-800': role === 'user' },
    { 'bg-gray-50 dark:bg-gray-700': role === 'assistant' },
  );

  return (
    <div className={messageClassName}>
      <div>{role === 'user' ? <Identicon diameter={20} className="w-5 h-5" /> : <IconGhost2 size={20} />}</div>
      {role === 'user' ? (
        <div className="whitespace-pre-line overflow-x-auto">{content}</div>
      ) : (
        <div className="relative flex flex-col w-[calc(100%-50px)] lg:w-[calc(100%-65px)] h-full">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypePrism]}
            linkTarget="_blank"
            className="prose dark:prose-invert max-w-none overflow-x-auto prose-p:whitespace-pre-line prose-table:border prose-table:border-collapse prose-th:border prose-th:border-gray-700 prose-th:align-baseline prose-th:pt-2 prose-th:pl-2 prose-td:border prose-td:border-gray-700 prose-td:pt-2 prose-td:pl-2 prose-a:text-primary-400 hover:prose-a:underline prose-pre:bg-gray-100 prose-pre:dark:bg-gray-800 prose-pre:text-gray-800 prose-pre:dark:text-gray-100 prose-code:bg-gray-100 prose-code:dark:bg-gray-800 prose-code:text-gray-800 prose-code:dark:text-gray-100"
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
      {role === 'assistant' ? (
        <IconCopy
          size={20}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          role="button"
          onClick={async () => await copyToClipboard(content)}
        />
      ) : null}
    </div>
  );
};

export const getServerSideProps = withIronSessionSsr(async function ({ req, params }) {
  const { user } = req.session;
  const deckId = params?.deckId as string;

  if (!user || !process.env.DAEMON_USERS?.split(',').includes(user.id)) {
    return { redirect: { destination: `/app/${deckId}`, permanent: false } };
  } else {
    return { props: {} };
  }
}, ironOptions);
