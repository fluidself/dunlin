import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import mermaid from 'mermaid';
import { IconCode } from '@tabler/icons';
import { Editor, Transforms } from 'slate';
import { ReactEditor, RenderElementProps, useSlateStatic, useReadOnly, useFocused, useSelected } from 'slate-react';
import { MermaidDiagram, CodeBlock, ElementType } from 'types/slate';
import { deserializeCodeLine } from 'editor/plugins/withCodeBlocks';
import { useStore } from 'lib/store';
import { mermaidConfig, renderGraph } from 'utils/mermaid';
import Tooltip from 'components/Tooltip';

type Props = {
  element: MermaidDiagram;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function MermaidElement(props: Props) {
  const { attributes, children, element, className } = props;
  const { id, definition } = element;
  const readOnly = useReadOnly();
  const editor = useSlateStatic();
  const selected = useSelected();
  const focused = useFocused();
  const darkMode = useStore(state => state.darkMode);
  const mermaidId = useMemo(() => `mermaid-${id}`, [id]);
  const config = useMemo(() => mermaidConfig(darkMode), [darkMode]);
  const path = useMemo(() => ReactEditor.findPath(editor, element), [editor, element]);
  const [html, setHtml] = useState('');

  useEffect(() => {
    mermaid.initialize(config);
  }, [config]);

  useEffect(() => {
    if (definition) {
      const result = renderGraph(mermaidId, definition);
      setHtml(result);
    }
  }, [definition, mermaidId, config]);

  const convertToCodeBlock = useCallback(() => {
    const codeLines = definition.split('\n').map(deserializeCodeLine);
    const codeBlock: CodeBlock = {
      id: id,
      type: ElementType.CodeBlock,
      lang: 'mermaid',
      children: codeLines,
    };

    Transforms.removeNodes(editor, { match: n => n.type === ElementType.MermaidDiagram, at: path });
    Transforms.insertNodes(editor, codeBlock, { at: path });

    const [codePath] = Array.from(
      Editor.nodes<CodeBlock>(editor, {
        at: [],
        match: n => n.type === ElementType.CodeBlock && n.id === id,
      }),
    ).map(entry => entry[1]);

    if (codePath) {
      Transforms.select(editor, codePath);
    }
    ReactEditor.focus(editor);
  }, [editor, definition, id, path]);

  if (!html) return null;

  return (
    <div className={className} {...attributes}>
      <div
        className={`p-2 border border-transparent rounded relative group ${
          selected && focused
            ? 'ring ring-primary-100 dark:ring-primary-900'
            : 'hover:border-gray-300 dark:hover:border-gray-700'
        }`}
      >
        <div contentEditable={false}>
          {!readOnly && (
            <Tooltip content="Edit this block" placement="bottom">
              <button
                className="opacity-0.1 group-hover:opacity-100 flex items-center absolute top-0.5 right-0.5 p-1 rounded dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={convertToCodeBlock}
              >
                <IconCode size={18} />
              </button>
            </Tooltip>
          )}
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        {children}
      </div>
    </div>
  );
}
