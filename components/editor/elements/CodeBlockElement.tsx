import { ChangeEvent, ReactNode, useState, useCallback } from 'react';
import { Transforms } from 'slate';
import { ReactEditor, RenderElementProps, useSlateStatic, useReadOnly } from 'slate-react';
import { CodeBlock } from 'types/slate';

type Props = {
  element: CodeBlock;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function CodeBlockElement(props: Props) {
  const { attributes, children, element, className } = props;

  const editor = useSlateStatic();
  const readOnly = useReadOnly();
  const { lang } = element;
  const [language, setLanguage] = useState(lang);
  const codeClassName = lang ? `language-${lang}` : '';

  const onSelectChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      if (readOnly) {
        return;
      }
      try {
        const path = ReactEditor.findPath(editor, element);
        const newProperties: Partial<CodeBlock> = {
          lang: event.target.value,
        };
        path && Transforms.setNodes(editor, newProperties, { at: path });
        setLanguage(event.target.value);
      } catch (e) {
        const message = e instanceof Error ? e.message : e;
        console.error(`There was an error updating the language: ${message}`);
      }
    },
    [editor, element, readOnly],
  );

  return (
    <pre
      className={`block p-2 border rounded dark:bg-gray-800 dark:border-gray-700 whitespace-pre-wrap overflow-x-auto ${className}`}
      {...attributes}
    >
      {!readOnly && (
        <select
          value={language}
          style={{
            background: 'transparent',
            position: 'absolute',
            top: '-10px',
            right: '6px',
            padding: '2px',
            border: 'none',
            textAlign: 'right',
            fontSize: '14px',
            cursor: 'pointer',
            outline: 'none',
          }}
          onChange={onSelectChange}
          contentEditable={false}
          {...props}
        >
          <option value="">Plaintext</option>
          {Object.entries(CODE_BLOCK_LANGUAGES).map(([key, val]) => (
            <option key={key} value={key}>
              {val}
            </option>
          ))}
        </select>
      )}
      <code className={codeClassName}>{children}</code>
    </pre>
  );
}

export const CODE_BLOCK_LANGUAGES: Record<string, string> = {
  bash: 'Bash',
  css: 'CSS',
  // go: 'Go',
  graphql: 'GraphQL',
  html: 'HTML',
  javascript: 'JavaScript',
  json: 'JSON',
  jsx: 'JSX',
  latex: 'LaTeX',
  python: 'Python',
  // ruby: 'Ruby',
  solidity: 'Solidity',
  sql: 'SQL',
  tsx: 'TSX',
  typescript: 'TypeScript',
  wasm: 'WebAssembly',
};
