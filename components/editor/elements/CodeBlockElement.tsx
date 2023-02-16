import { ChangeEvent, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { Editor, createEditor, Node, Transforms, Path } from 'slate';
import { ReactEditor, RenderElementProps, useSlateStatic, useReadOnly } from 'slate-react';
import { CODE_BLOCK_LANGUAGES } from 'editor/decorateCodeBlocks';
import { CodeBlock, ElementType, MermaidDiagram } from 'types/slate';
import { useCurrentNote } from 'utils/useCurrentNote';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { encrypt } from 'utils/encryption';
import updateNote from 'lib/api/updateNote';
import { store } from 'lib/store';

type Props = {
  element: CodeBlock;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function CodeBlockElement(props: Props) {
  const { attributes, children, element, className } = props;
  const { lang } = element;
  const editor = useSlateStatic();
  const readOnly = useReadOnly();
  const { id: noteId } = useCurrentNote();
  const { key } = useCurrentDeck();
  const path = useMemo(() => ReactEditor.findPath(editor, element), [editor, element]);
  const isMermaidCodeBlockFocused = useMemo(
    () => lang === 'mermaid' && editor.selection && Path.isDescendant(editor.selection.anchor.path, path),
    [lang, path, editor.selection],
  );

  const onSelectChange = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>) => {
      if (readOnly) return;

      try {
        const newProperties: Partial<CodeBlock> = { lang: event.target.value };
        Transforms.setNodes(editor, newProperties, { at: path });

        // Update note locally and in database
        const noteEditor = createEditor();
        noteEditor.children = store.getState().notes[noteId].content;
        Transforms.setNodes(noteEditor, newProperties, { at: path });

        store.getState().updateNote({ id: noteId, content: noteEditor.children });

        const encryptedContent = encrypt(noteEditor.children, key);
        await updateNote({ id: noteId, content: encryptedContent });
      } catch (e) {
        const message = e instanceof Error ? e.message : e;
        console.error(`There was an error updating the language: ${message}`);
      }
    },
    [editor, readOnly, key, noteId, path],
  );

  const convertToMermaid = useCallback(() => {
    const graphDefinition = Array.from(Editor.nodes(editor, { at: path, match: n => n.type === ElementType.CodeLine }))
      .map(entry => entry[0])
      .map(line => Node.string(line))
      .join('\n');
    if (!graphDefinition) return;

    const mermaidDiagram: MermaidDiagram = {
      id: element.id,
      type: ElementType.MermaidDiagram,
      definition: graphDefinition,
      children: [],
    };

    Transforms.removeNodes(editor, { match: n => n.type === ElementType.CodeBlock, at: path });
    Transforms.insertNodes(editor, mermaidDiagram, { at: path });
  }, [editor, path, element.id]);

  useEffect(() => {
    if (lang === 'mermaid' && !isMermaidCodeBlockFocused) {
      convertToMermaid();
    }
  }, [lang, isMermaidCodeBlockFocused, convertToMermaid]);

  return (
    <pre
      className={`block relative p-2 border rounded dark:bg-gray-800 dark:border-gray-700 whitespace-pre-wrap overflow-x-auto ${className}`}
      {...attributes}
    >
      {!readOnly && (
        <select
          value={lang ?? ''}
          onChange={onSelectChange}
          contentEditable={false}
          className="bg-transparent absolute top-0 right-0 p-0.5 pr-7 border-none focus:ring-0 focus:shadow-none ring-offset-0 text-right cursor-pointer text-[13px]"
        >
          <option value="">Plaintext</option>
          {Object.entries(CODE_BLOCK_LANGUAGES).map(([key, val]) => (
            <option key={key} value={key}>
              {val}
            </option>
          ))}
        </select>
      )}
      <code className={`language-${lang ?? ''}`}>{children}</code>
    </pre>
  );
}
