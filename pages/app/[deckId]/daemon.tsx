import Head from 'next/head';
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
  IconSettings,
  IconX,
} from '@tabler/icons';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import classNames from 'classnames';
import { usePopper } from 'react-popper';
import { Menu } from '@headlessui/react';
import type { Descendant } from 'slate';
import { toast } from 'react-toastify';
import rehypePrism from 'rehype-prism';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import wikiLinkPlugin from 'remark-wiki-link';
import remarkToSlate from 'editor/serialization/remarkToSlate';
import remarkSupersub from 'lib/remark-supersub';
import ReactMarkdown from 'lib/react-markdown';
import upsertNote from 'lib/api/upsertNote';
import { useStore } from 'lib/store';
import type { DaemonMessage } from 'lib/createDaemonSlice';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { useAuth } from 'utils/useAuth';
import copyToClipboard from 'utils/copyToClipboard';
import OpenSidebarButton from 'components/sidebar/OpenSidebarButton';
import ErrorBoundary from 'components/ErrorBoundary';
import Identicon from 'components/Identicon';
import Portal from 'components/Portal';
import Tooltip from 'components/Tooltip';

export default function Daemon() {
  const router = useRouter();
  const { user } = useAuth();
  const { id: deckId } = useCurrentDeck();
  const isSidebarOpen = useStore(state => state.isSidebarOpen);
  const authorOnlyNotes = useStore(state => state.authorOnlyNotes);
  const messages = useStore(state => state.messages);
  const temperature = useStore(state => state.temperature);
  const maxTokens = useStore(state => state.maxTokens);
  const setMessages = useStore(state => state.setMessages);
  const setTemperature = useStore(state => state.setTemperature);
  const setMaxTokens = useStore(state => state.setMaxTokens);
  const [inputText, setInputText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [summoning, setSummoning] = useState(false);
  const [isError, setIsError] = useState(false);
  const [saving, setIsSaving] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(0);
  const daemonContainerRef = useRef<HTMLDivElement | null>(null);
  const growingWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (user && !process.env.NEXT_PUBLIC_DAEMON_USERS?.split(',').includes(user.id)) {
      router.replace('/app');
    }
  }, [user, router]);

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
    const userMessage: DaemonMessage = { type: 'human', text: inputText };
    const ctrl = new AbortController();

    setSummoning(true);
    setIsError(false);
    setMessages(prevMessages => [...prevMessages, userMessage]);
    updateInputText('');

    fetchEventSource('/api/daemon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: [...messages, userMessage], temperature, maxTokens }),
      signal: ctrl.signal,
      async onopen(response) {
        if (response.ok) {
          setMessages(prevMessages => [...prevMessages, { type: 'ai', text: '' }]);
          return;
        } else {
          setIsError(true);
          setSummoning(false);
        }
      },
      onmessage(event) {
        const data = JSON.parse(event.data);
        setMessages(prevMessages => {
          const lastMsg = prevMessages[prevMessages.length - 1];
          const newMessages = [...prevMessages.slice(0, -1), { ...lastMsg, text: lastMsg.text + data.token }];
          return newMessages;
        });
      },
      onclose() {
        setSummoning(false);
        ctrl.abort();
      },
      onerror() {
        setIsError(true);
        setSummoning(false);
        ctrl.abort();
      },
    });
  };

  const saveAsNote = async () => {
    if (!user?.id || !noteTitle) return;

    const parsedMessages = messages
      .map(message => `**${message.type === 'human' ? 'User' : 'Daemon'}**:\n${message.text}\n\n---\n\n`)
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
            <div className="sticky bottom-0 flex flex-col items-center space-y-1 pt-3 pb-12 md:w-128 lg:w-160 xl:w-192 bg-white dark:bg-gray-900">
              <div className="flex justify-end w-full space-x-2">
                {messages.length && !summoning && !saving ? (
                  <div className="flex items-center space-x-2">
                    <Tooltip content="Reset daemon">
                      <button
                        className="flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600 dark:text-gray-100"
                        disabled={summoning}
                        onClick={() => setMessages([])}
                      >
                        <IconRefresh size={16} className="text-gray-600 dark:text-gray-300" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Save as note">
                      <button
                        className="flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600 dark:text-gray-100"
                        disabled={summoning}
                        onClick={() => setIsSaving(true)}
                      >
                        <IconDownload size={16} className="text-gray-600 dark:text-gray-300" />
                      </button>
                    </Tooltip>
                  </div>
                ) : messages.length && !summoning && saving ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      className="input px-1 h-[28px] text-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
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
                      <IconCheck size={16} />
                    </button>
                    <button
                      className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
                      onClick={() => setIsSaving(false)}
                    >
                      <IconX size={16} />
                    </button>
                  </div>
                ) : null}
                <SettingsMenu
                  temperature={temperature}
                  setTemperature={setTemperature}
                  maxTokens={maxTokens}
                  setMaxTokens={setMaxTokens}
                />
              </div>
              <div className="flex items-center w-full relative">
                <div className="w-full h-full grid text-lg grow-wrap" ref={growingWrapperRef}>
                  <textarea
                    className={`pl-2 pr-6 py-3 text-lg dark:bg-gray-800 shadow-popover border dark:text-gray-200 border-gray-50 dark:border-gray-700 focus:ring-0 focus:border-primary-500 resize-none overflow-hidden row-start-1 row-end-2 col-start-1 col-end-2 ${
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
                <div className="flex items-center pt-2 text-sm text-red-500">
                  <IconExclamationCircle className="mr-1" size={16} />
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

type SettingsMenuProps = {
  temperature: number;
  setTemperature: (temperature: number) => void;
  maxTokens: number;
  setMaxTokens: (maxTokens: number) => void;
};

const SettingsMenu = (props: SettingsMenuProps) => {
  const { temperature, setTemperature, maxTokens, setMaxTokens } = props;

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(buttonRef.current, popperElement, {
    placement: 'top-end',
  });

  return (
    <Menu>
      {({ open }) => (
        <>
          <Menu.Button
            className="rounded hover:bg-gray-100 active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600"
            ref={buttonRef}
          >
            <Tooltip content="Settings">
              <span className="flex items-center justify-center w-7 h-7">
                <IconSettings size={16} className="text-gray-600 dark:text-gray-300" />
              </span>
            </Tooltip>
          </Menu.Button>
          {open && (
            <Portal>
              <Menu.Items
                className="z-20 w-auto bg-white rounded dark:bg-gray-800 shadow-popover focus:outline-none border dark:border-gray-700"
                static
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
              >
                <div className="flex flex-col space-y-2 p-2 dark:text-gray-200">
                  <div className="flex justify-between text-sm">
                    <label htmlFor="temperature">Temperature</label>
                    <span>{temperature}</span>
                  </div>
                  <input
                    id="temperature"
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={temperature}
                    onChange={e => setTemperature(+e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded appearance-none cursor-pointer accent-primary-500 dark:bg-gray-700"
                  />
                </div>
                <div className="flex flex-col space-y-2 p-2 dark:text-gray-200">
                  <div className="flex justify-between text-sm">
                    <label htmlFor="max_tokens">Max. length</label>
                    <span>{maxTokens}</span>
                  </div>
                  <input
                    id="max_tokens"
                    type="range"
                    min={1}
                    max={2048}
                    step={1}
                    value={maxTokens}
                    onChange={e => setMaxTokens(+e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded appearance-none cursor-pointer accent-primary-500 dark:bg-gray-700"
                  />
                </div>
              </Menu.Items>
            </Portal>
          )}
        </>
      )}
    </Menu>
  );
};

type MessageProps = {
  message: DaemonMessage;
};

const Message = (props: MessageProps) => {
  const { type, text } = props.message;
  const messageClassName = classNames(
    'flex w-full space-x-2 py-4 pl-2 dark:text-gray-200',
    { 'bg-gray-100 dark:bg-gray-800': type === 'human' },
    { 'bg-gray-50 dark:bg-gray-700': type === 'ai' },
  );

  return (
    <div className={messageClassName}>
      <div>{type === 'human' ? <Identicon diameter={20} className="w-5 h-5" /> : <IconGhost2 size={20} />}</div>
      {type === 'human' ? (
        <div className="whitespace-pre-line overflow-x-auto">{text}</div>
      ) : (
        <div className="relative flex flex-col w-[calc(100%-50px)] lg:w-[calc(100%-65px)] h-full">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypePrism]}
            linkTarget="_blank"
            className="prose dark:prose-invert max-w-none overflow-x-auto prose-p:whitespace-pre-line prose-table:border prose-table:border-collapse prose-th:border prose-th:border-gray-700 prose-th:align-baseline prose-th:pt-2 prose-th:pl-2 prose-td:border prose-td:border-gray-700 prose-td:pt-2 prose-td:pl-2 prose-a:text-primary-400 hover:prose-a:underline prose-pre:bg-gray-100 prose-pre:dark:bg-gray-800 prose-pre:text-gray-800 prose-pre:dark:text-gray-100 prose-code:bg-gray-100 prose-code:dark:bg-gray-800 prose-code:text-gray-800 prose-code:dark:text-gray-100"
          >
            {text}
          </ReactMarkdown>
        </div>
      )}
      {type === 'ai' ? (
        <IconCopy
          size={20}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          role="button"
          onClick={async () => await copyToClipboard(text)}
        />
      ) : null}
    </div>
  );
};
