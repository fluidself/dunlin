import { memo, useEffect, useRef } from 'react';
import { IconCopy } from '@tabler/icons';
import Prism from 'prismjs';
import copyToClipboard from 'utils/copyToClipboard';

type CodeBlockProps = {
  language: string;
  value: string;
};

function CodeBlock(props: CodeBlockProps) {
  const { language, value } = props;
  const codeBlockRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (codeBlockRef.current) {
      Prism.highlightElement(codeBlockRef.current);
    }
  }, []);

  return (
    <div className="relative">
      <div className="absolute top-[-3px] right-1">
        <IconCopy
          size={18}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          role="button"
          onClick={async () => await copyToClipboard(value)}
        />
      </div>
      <pre className="!p-2">
        <code ref={codeBlockRef} className={`language-${language ?? ''}`}>
          {value}
        </code>
      </pre>
    </div>
  );
}

export default memo(CodeBlock);
