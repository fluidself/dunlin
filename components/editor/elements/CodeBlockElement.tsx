import { ChangeEvent, ReactNode, useState, useCallback } from 'react';
import { Transforms } from 'slate';
import { ReactEditor, RenderElementProps, useSlateStatic, useReadOnly } from 'slate-react';
import { CODE_BLOCK_LANGUAGES } from 'editor/decorateCodeBlocks';
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
      if (readOnly) return;

      try {
        const path = ReactEditor.findPath(editor, element);
        const newProperties: Partial<CodeBlock> = {
          lang: event.target.value,
        };
        Transforms.setNodes(editor, newProperties, { at: path });
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
          onChange={onSelectChange}
          contentEditable={false}
          className="bg-transparent absolute top-0.5 right-[-4px] p-0.5 pr-7 border-none focus:ring-0 focus:shadow-none ring-offset-0 text-right cursor-pointer text-[13px]"
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
