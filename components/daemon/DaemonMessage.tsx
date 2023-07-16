import { memo } from 'react';
import { IconCopy, IconGhost2 } from '@tabler/icons';
import type { Message } from 'ai/react';
import classNames from 'classnames';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'lib/react-markdown';
import copyToClipboard from 'utils/copyToClipboard';
import Identicon from 'components/Identicon';
import CodeBlock from './CodeBlock';

type DaemonMessageProps = {
  message: Message;
  messageIsLatest: boolean;
  messageIsStreaming: boolean;
};

function DaemonMessage(props: DaemonMessageProps) {
  const {
    message: { role, content },
    messageIsLatest,
    messageIsStreaming,
  } = props;
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
        <div className="relative flex flex-col w-[calc(100%-50px)] lg:w-[calc(100%-60px)] h-full">
          {content ? (
            <ReactMarkdown
              className="prose dark:prose-invert max-w-none overflow-x-auto prose-p:whitespace-pre-line prose-a:text-primary-400 hover:prose-a:underline prose-pre:m-0 prose-pre:p-0 prose-pre:bg-gray-100 prose-pre:dark:bg-gray-800 prose-pre:text-gray-800 prose-pre:dark:text-gray-100 prose-code:bg-gray-100 prose-code:dark:bg-gray-800 prose-code:text-gray-800 prose-code:dark:text-gray-100"
              linkTarget="_blank"
              remarkPlugins={[remarkGfm]}
              components={{
                code({ children, className, inline, ...props }) {
                  if (children.length) {
                    if (children[0] == '▍') {
                      return <span className="animate-pulse">▍</span>;
                    }
                    children[0] = (children[0] as string).replace('`▍`', '▍');
                  }
                  const match = /language-(\w+)/.exec(className || '');

                  return !inline ? (
                    <CodeBlock
                      key={Math.random()}
                      language={(match && match[1]) || ''}
                      value={String(children).replace(/\n$/, '')}
                      {...props}
                    />
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                table({ children }) {
                  return (
                    <table className="border-collapse border border-gray-700 px-2 py-1 dark:border-gray-300">
                      {children}
                    </table>
                  );
                },
                th({ children }) {
                  return (
                    <th className="break-words align-baseline border border-gray-700 bg-gray-200 dark:bg-gray-800 px-2 py-1 dark:border-gray-300">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td className="break-words border border-gray-700 px-2 py-1 dark:border-gray-300">{children}</td>
                  );
                },
              }}
            >
              {`${content}${messageIsLatest && messageIsStreaming ? '`▍`' : ''}`}
            </ReactMarkdown>
          ) : (
            <span className="animate-pulse">▍</span>
          )}
        </div>
      )}
      {role === 'assistant' ? (
        <IconCopy
          size={18}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          role="button"
          onClick={async () => await copyToClipboard(content)}
        />
      ) : null}
    </div>
  );
}

export default memo(DaemonMessage);
