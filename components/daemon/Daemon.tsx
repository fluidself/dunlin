import { useEffect, useRef, useState } from 'react';
import {
  IconArrowDown,
  IconCheck,
  IconDownload,
  IconExclamationCircle,
  IconPlayerStop,
  IconRefresh,
  IconSend,
  IconX,
} from '@tabler/icons';
import { useChat } from 'ai/react';
import { nanoid } from 'nanoid';
import { toast } from 'react-toastify';
import upsertNote from 'lib/api/upsertNote';
import { store, useStore } from 'lib/store';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { useAuth } from 'utils/useAuth';
import { caseInsensitiveStringEqual } from 'utils/string';
import { stringToSlate } from 'editor/utils';
import useOnNoteLinkClick from 'editor/useOnNoteLinkClick';
import ErrorBoundary from 'components/ErrorBoundary';
import Tooltip from 'components/Tooltip';
import SettingsMenu from 'components/daemon/SettingsMenu';
import DaemonSidebarHeader from './DaemonSidebarHeader';
import DaemonMessage from './DaemonMessage';

export default function Daemon() {
  const { user } = useAuth();
  const { id: deckId } = useCurrentDeck();
  const authorOnlyNotes = useStore(state => state.authorOnlyNotes);
  const isPageStackingOn = useStore(state => state.isPageStackingOn);
  const lastOpenNoteId = useStore(state => state.openNoteIds[state.openNoteIds.length - 1]);
  const isDaemonSidebarOpen = useStore(state => state.isDaemonSidebarOpen);
  const isDaemonUser = useStore(state => state.isDaemonUser);
  const storeMessages = useStore(state => state.messages);
  const model = useStore(state => state.model);
  const temperature = useStore(state => state.temperature);
  const setStoreMessages = useStore(state => state.setMessages);
  const setModel = useStore(state => state.setModel);
  const setTemperature = useStore(state => state.setTemperature);
  const { onClick: onNoteLinkClick } = useOnNoteLinkClick(lastOpenNoteId);
  const { messages, isLoading, input, setInput, setMessages, append, handleInputChange, stop } = useChat({
    api: '/api/daemon',
    initialMessages: storeMessages,
    body: { model, temperature },
    onError(error) {
      console.log(error);
      setIsError(true);
    },
    onFinish(message) {
      setStoreMessages(prevMessages => [...prevMessages, message]);
    },
  });
  const [noteTitle, setNoteTitle] = useState('');
  const [isError, setIsError] = useState(false);
  const [saving, setIsSaving] = useState(false);
  const endofMessagesRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textareaRef && textareaRef.current && !saving) {
      setTimeout(() => textareaRef?.current?.focus(), 200);
    }
  }, [isDaemonSidebarOpen, saving]);

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
      textareaRef.current.style.overflow = `${textareaRef.current?.scrollHeight > 300 ? 'auto' : 'hidden'}`;
    }
  }, [input]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (endofMessagesRef && endofMessagesRef.current) {
      endofMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const summonDaemon = async () => {
    if (isLoading || !input) return;
    const id = nanoid(7);

    setIsError(false);
    setInput('');
    setStoreMessages(prevMessages => [...prevMessages, { id, role: 'user', content: input }]);
    await append({ id, role: 'user', content: input });
  };

  const saveAsNote = async () => {
    if (!user?.id || !noteTitle) return;
    const notesArr = Object.values(store.getState().notes);
    const isTitleUnique = notesArr.findIndex(n => caseInsensitiveStringEqual(n.title, noteTitle)) === -1;

    if (!isTitleUnique) {
      toast.error(`There's already a note called ${noteTitle}. Please use a different title.`);
      return;
    }

    const parsedMessages = storeMessages
      .map(message => `**${message.role === 'user' ? 'User' : 'Daemon'}**:\n${message.content}\n\n---\n\n`)
      .join('');
    const slateContent = stringToSlate(parsedMessages);
    const newNote = {
      deck_id: deckId,
      user_id: user.id,
      author_only: authorOnlyNotes,
      title: noteTitle,
      content: slateContent,
    };
    const note = await upsertNote(newNote);

    if (!note) {
      toast.error(`There was an error creating the note ${noteTitle}.`);
      return;
    }

    setNoteTitle('');
    setIsSaving(false);
    onNoteLinkClick(note.id, isPageStackingOn);
  };

  if (!isDaemonUser) return null;

  return (
    <ErrorBoundary>
      <div className="flex flex-col flex-1 w-full h-full">
        <DaemonSidebarHeader />
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="flex flex-col flex-1 mx-auto md:w-128 lg:w-160 xl:w-192">
            <div className="flex-1">
              {messages.map((message, idx) => (
                <DaemonMessage
                  key={idx}
                  message={message}
                  messageIsLatest={idx === (messages.length ?? 0) - 1}
                  messageIsStreaming={isLoading}
                />
              ))}
              <div ref={endofMessagesRef} />
            </div>
            <div className="sticky bottom-0 flex flex-col items-center pt-3 pb-12 md:w-128 lg:w-160 xl:w-192 bg-white dark:bg-gray-900">
              <div className="flex justify-end w-full space-x-2 mb-1">
                {storeMessages.length && !isLoading && !saving ? (
                  <div className="flex items-center space-x-2">
                    <Tooltip content="Reset daemon">
                      <button
                        className="flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600 dark:text-gray-100"
                        disabled={isLoading}
                        onClick={() => {
                          setMessages([]);
                          setStoreMessages([]);
                          setIsError(false);
                        }}
                      >
                        <IconRefresh size={16} className="text-gray-600 dark:text-gray-300" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Save as note">
                      <button
                        className="flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600 dark:text-gray-100"
                        disabled={isLoading}
                        onClick={() => setIsSaving(true)}
                      >
                        <IconDownload size={16} className="text-gray-600 dark:text-gray-300" />
                      </button>
                    </Tooltip>
                  </div>
                ) : storeMessages.length && !isLoading && saving ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      className="input px-1 h-[28px] text-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                      placeholder="Enter note name"
                      value={noteTitle}
                      onChange={event => setNoteTitle(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === 'Escape') {
                          event.stopPropagation();
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
                  model={model}
                  setModel={setModel}
                  temperature={temperature}
                  setTemperature={setTemperature}
                />
              </div>
              <div className="flex items-center w-full min-h-fit relative">
                <textarea
                  ref={textareaRef}
                  placeholder="Send a message..."
                  className={`w-full pl-2 pr-6 py-3 dark:bg-gray-800 shadow-popover border dark:text-gray-200 border-gray-50 dark:border-gray-700 focus:ring-0 focus:border-primary-500 resize-none ${
                    isLoading ? 'rounded-tl rounded-tr' : 'rounded'
                  }`}
                  style={{
                    minHeight: '48px',
                    maxHeight: '300px',
                    overflow: `${textareaRef.current && textareaRef.current.scrollHeight > 300 ? 'auto' : 'hidden'}`,
                  }}
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey && input) {
                      event.preventDefault();
                      !isLoading && summonDaemon();
                    }
                  }}
                />
                {isLoading ? (
                  <button
                    className="rounded absolute bottom-2.5 right-2 p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={stop}
                  >
                    <IconPlayerStop size={18} className="fill-gray-600 dark:fill-gray-300" />
                  </button>
                ) : (
                  <button
                    className={`rounded absolute bottom-2.5 right-2 p-1 ${
                      input
                        ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                        : 'text-gray-300 dark:text-gray-600 cursor-default'
                    }`}
                    disabled={!input}
                    onClick={summonDaemon}
                  >
                    <IconSend size={18} />
                  </button>
                )}
              </div>
              <div className="w-full h-1">
                {isLoading ? (
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
        </div>
        {messages.length ? (
          <button
            className="absolute right-3.5 md:bottom-[120px] p-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            onClick={scrollToBottom}
          >
            <IconArrowDown size={20} className="text-gray-500 dark:text-gray-300" />
          </button>
        ) : null}
      </div>
    </ErrorBoundary>
  );
}
