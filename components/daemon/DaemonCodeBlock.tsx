import { memo, useEffect } from 'react';
import { IconCopy } from '@tabler/icons';
import Prism from 'prismjs';
import copyToClipboard from 'utils/copyToClipboard';

type DaemonCodeBlockProps = {
  language: string;
  value: string;
};

function DaemonCodeBlock({ language, value }: DaemonCodeBlockProps) {
  useEffect(() => {
    Prism.highlightAll();
  }, []);

  return (
    <div className="relative">
      <div className="absolute top-[-2px] right-1">
        <IconCopy
          size={20}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          role="button"
          onClick={async () => await copyToClipboard(value)}
        />
      </div>
      <pre className="!p-2">
        <code className={`language-${language ?? ''}`}>{value}</code>
      </pre>
    </div>
  );
}

export default memo(DaemonCodeBlock);
